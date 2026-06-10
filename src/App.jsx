import React, { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  RotateCcw,
  ArrowRight,
  Save,
  Check,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import axios from "axios";

const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

export default function App() {
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home");
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("flashcard_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const cursorRef = useRef(null);

  const activeDeck = decks.find((d) => d._id === activeDeckId) || null;

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const emailToFetch = user ? user.email : "default";
        const response = await axios.get(
          `${API_URL}?userEmail=${emailToFetch}`
        );
        if (Array.isArray(response.data)) {
          setDecks(response.data);
        } else {
          setDecks([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchDecks();
  }, [user]);

  useEffect(() => {
    const moveCursor = (e) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        currentView !== "study" ||
        !activeDeck ||
        !activeDeck.cards ||
        activeDeck.cards.length === 0
      ) {
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIsFlipped(false);
        setCardIndex((prev) => (prev + 1) % activeDeck.cards.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIsFlipped(false);
        setCardIndex(
          (prev) =>
            (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, activeDeck]);

  const handleSuccess = (credentialResponse) => {
    try {
      const token = credentialResponse?.credential;
      if (!token) return;
      const decoded = jwtDecode(token);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      };
      setUser(userData);
      localStorage.setItem("flashcard_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
    }
  };

  const handleFailure = () => {
    console.log("Đăng nhập thất bại hoặc người dùng đã đóng tab!");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("flashcard_user");
  };

  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      setSaveStatus("saving");
      const res = await axios.post(API_URL, {
        title: newDeckTitle.trim(),
        cards: [],
        userEmail: user ? user.email : "default",
      });
      setDecks((prev) => [...prev, res.data]);
      setNewDeckTitle("");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi khi tạo bộ từ vựng:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleDeleteDeck = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/${id}`);
      setDecks((prev) => prev.filter((d) => d._id !== id));
      if (activeDeckId === id) {
        setCurrentView("home");
        setActiveDeckId(null);
        setCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error("Lỗi khi xóa bộ từ vựng:", err);
    }
  };

  const handleAddCard = async () => {
    if (!activeDeck) return;

    if (!newCard.korean.trim() || !newCard.viet.trim()) {
      alert("Vui lòng nhập từ tiếng Hàn và nghĩa tiếng Việt!");
      return;
    }

    const updatedCards = [
      ...(activeDeck.cards || []),
      { ...newCard, id: Date.now().toString() },
    ];

    try {
      setSaveStatus("saving");
      const res = await axios.put(`${API_URL}/${activeDeckId}`, {
        title: activeDeck.title,
        cards: updatedCards,
        userEmail: activeDeck.userEmail || (user ? user.email : "default"),
      });
      setDecks((prev) =>
        prev.map((d) => (d._id === activeDeckId ? res.data : d))
      );
      setNewCard({ korean: "", romaji: "", viet: "", note: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi khi thêm từ vựng:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!activeDeck) return;
    const updatedCards = (activeDeck.cards || []).filter(
      (c) => c.id !== cardId
    );

    try {
      setSaveStatus("saving");
      const res = await axios.put(`${API_URL}/${activeDeckId}`, {
        title: activeDeck.title,
        cards: updatedCards,
        userEmail: activeDeck.userEmail || (user ? user.email : "default"),
      });
      setDecks((prev) =>
        prev.map((d) => (d._id === activeDeckId ? res.data : d))
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Lỗi khi xóa thẻ từ:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const goStudy = (deck) => {
    if (!deck.cards || deck.cards.length === 0) {
      alert("Vui lòng thêm từ vựng trước khi học!");
      return;
    }
    setActiveDeckId(deck._id);
    setCardIndex(0);
    setIsFlipped(false);
    setCurrentView("study");
  };

  const goEdit = (deck) => {
    setActiveDeckId(deck._id);
    setCurrentView("edit");
    setCardIndex(0);
    setIsFlipped(false);
  };

  const currentCard = activeDeck?.cards?.[cardIndex];

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-pink-200 selection:text-purple-950 bg-gradient-to-br from-[#ffe7f4] via-[#f7eaff] to-[#e8f1ff] text-gray-800">
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 w-[420px] h-[420px] rounded-full z-0 transition-transform duration-75 ease-out will-change-transform hidden md:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(251, 194, 235, 0.52) 0%, rgba(166, 193, 238, 0) 66%)",
          filter: "blur(34px)",
        }}
      />

      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/65 backdrop-blur-2xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-pink-200/50 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-purple-200/50 blur-3xl" />
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 shadow-sm border border-white/80">
                <Sparkles className="text-pink-500" size={24} />
              </div>
              <h2 className="mb-3 text-3xl md:text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-pink-600 font-title">
                Annyeonghaseyo! 🌸
              </h2>
              <p className="mb-8 text-sm md:text-base leading-relaxed text-gray-700 font-medium">
                Chào mừng bạn trở lại không gian học tập dreamy. Cơ sở dữ liệu
                đã sẵn sàng, bạn muốn thay đổi cuộc sống chứ 🇰🇷 🩵
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold shadow-lg shadow-pink-200/60 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  học thuiii
                </button>
                <button
                  onClick={() => {
                    alert(
                      "Từ chối không được đâu nhé, học tập chăm chỉ đi nào!"
                    );
                    setShowWelcomeModal(false);
                  }}
                  className="px-6 py-3 rounded-full bg-white/70 text-gray-700 font-semibold border border-white/80 hover:bg-white/90 transition-all"
                >
                  đéo mún học 🔥
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {saveStatus && (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium bg-white/70 backdrop-blur-xl border border-white/80">
          {saveStatus === "saving" && (
            <>
              <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
              <span>Đang lưu...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check size={16} className="text-green-600" />
              <span className="text-green-700">Đã lưu thành công!</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <X size={16} className="text-red-600" />
              <span className="text-red-700">Lỗi kết nối cơ sở dữ liệu!</span>
            </>
          )}
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 flex min-h-[44px] justify-end items-center">
          {!user ? (
            <div className="rounded-full overflow-hidden shadow-sm hover:shadow-md transition-all bg-white/70 backdrop-blur-xl border border-white/80">
              <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/70 backdrop-blur-xl px-4 py-2 shadow-sm">
              <img
                src={user.picture}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-pink-200"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs text-gray-500 font-medium">
                  Tài khoản
                </span>
                <span className="font-title text-sm font-bold text-purple-950">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 inline-flex items-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95"
                title="Đăng xuất"
              >
                <LogOut size={13} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>

        <header className="mb-10 rounded-[2rem] border border-white/70 bg-white/45 backdrop-blur-2xl shadow-sm px-6 py-6 md:px-8 md:py-7">
          <div className="text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="mb-2 text-4xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-800 via-pink-600 to-fuchsia-500 font-title">
                K-VOCAB STUDY LAB
              </h1>
              <p className="text-sm md:text-base font-medium text-gray-600">
                Học từ vựng tiếng Hàn trong một không gian mềm, sáng và mượt.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-center md:self-auto rounded-full bg-white/60 px-4 py-2 border border-white/80 text-sm font-semibold text-purple-700">
              <Sparkles size={16} className="text-pink-500" />
              pastel glassmorphism
            </div>
          </div>
        </header>

        {currentView === "home" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="rounded-[2rem] border border-white/80 bg-white/60 backdrop-blur-2xl p-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch">
              <input
                type="text"
                placeholder="Nhập tên bộ từ vựng mới..."
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
                className="flex-1 rounded-2xl border-0 bg-white/80 px-5 py-3.5 outline-none transition-all placeholder:text-pink-300 text-gray-700 font-medium focus:ring-2 focus:ring-pink-300"
              />
              <button
                onClick={handleCreateDeck}
                disabled={!newDeckTitle.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-pink-200/60 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                <Plus size={20} /> Tạo bộ từ
              </button>
            </div>

            {decks.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-purple-200 bg-white/35 py-14 text-center font-medium text-purple-400 backdrop-blur-xl">
                Chưa có bộ từ vựng nào. Hãy tạo mới ở trên nhé!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 backdrop-blur-2xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-200/40"
                  >
                    <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-pink-200/40 blur-3xl transition-transform group-hover:scale-125" />
                    <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-purple-200/40 blur-3xl transition-transform group-hover:scale-125" />
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="pr-4">
                        <h3 className="mb-2 text-xl font-black text-gray-900 font-title group-hover:text-purple-700 transition-colors">
                          {deck.title}
                        </h3>
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-sm font-semibold text-purple-500 border border-white/80">
                          <BookOpen size={14} /> {deck.cards?.length || 0} thẻ
                          từ
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDeck(deck._id)}
                        className="rounded-xl p-2 text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
                        title="Xóa bộ từ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="relative z-10 mt-6 flex gap-3">
                      <button
                        onClick={() => goEdit(deck)}
                        className="flex-1 rounded-xl bg-white/70 px-4 py-2.5 font-bold text-purple-700 border border-white/80 transition-all hover:bg-purple-50"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => goStudy(deck)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 px-4 py-2.5 font-bold text-white shadow-lg shadow-pink-200/60 transition-all hover:scale-[1.01] active:scale-[0.98]"
                      >
                        <BookOpen size={18} /> Học ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === "study" && activeDeck && (
          <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
            <button
              onClick={() => setCurrentView("home")}
              className="inline-flex items-center gap-2 rounded-full bg-white/45 px-4 py-2 font-bold text-purple-800 border border-white/80 backdrop-blur-xl transition-colors hover:text-purple-950"
            >
              <ArrowLeft size={18} /> Quay lại trang chủ
            </button>

            <div className="text-center">
              <h2 className="mb-1 font-title text-2xl font-black text-gray-900">
                {activeDeck.title}
              </h2>
              <p className="text-sm font-bold text-gray-500">
                Thẻ {cardIndex + 1} / {activeDeck.cards?.length || 0}
              </p>
            </div>

            {!activeDeck.cards || activeDeck.cards.length === 0 ? (
              <div className="rounded-[2rem] border border-white/80 bg-white/60 p-12 text-center font-medium text-gray-500 backdrop-blur-xl">
                Bộ từ vựng này chưa có thẻ nào cả. Hãy vào mục chỉnh sửa để thêm
                từ mới.
              </div>
            ) : (
              <>
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="group h-80 min-h-[320px] w-full cursor-pointer perspective-1000"
                >
                  <div
                    className={`relative h-full w-full rounded-[2rem] border border-white/80 shadow-xl duration-500 [transform-style:preserve-3d] ${
                      isFlipped ? "[transform:rotateX(180deg)]" : ""
                    }`}
                  >
                    <div className="absolute inset-0 [backface-visibility:hidden] rounded-[2rem] bg-gradient-to-br from-white/85 to-pink-50/80 p-8 text-center select-none flex flex-col items-center justify-center">
                      <div className="absolute top-6 right-6 text-pink-300/80">
                        <RotateCcw size={24} />
                      </div>
                      <span className="mb-4 text-5xl md:text-7xl font-black text-purple-950 drop-shadow-sm">
                        {currentCard?.korean}
                      </span>
                      {currentCard?.romaji && (
                        <span className="text-lg md:text-2xl font-bold uppercase tracking-[0.3em] text-purple-400">
                          [{currentCard.romaji}]
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)] rounded-[2rem] bg-gradient-to-br from-purple-600 via-pink-500 to-fuchsia-500 p-8 text-center select-none border border-white/30 flex flex-col items-center justify-center shadow-xl shadow-purple-500/20">
                      <div className="absolute top-6 right-6 text-white/60">
                        <RotateCcw size={24} />
                      </div>
                      <span className="mb-4 text-4xl md:text-5xl font-black text-white font-title drop-shadow-md">
                        {currentCard?.viet}
                      </span>
                      {currentCard?.note && (
                        <div className="max-w-xs rounded-2xl border border-white/20 bg-white/20 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur-sm">
                          {currentCard.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs font-bold tracking-wider text-gray-400">
                  {isFlipped
                    ? "← Click vào thẻ để lật lại mặt trước"
                    : "Click vào thẻ để xem nghĩa →"}
                </p>

                <div className="mt-4 flex items-center justify-center gap-6">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex(
                        (prev) =>
                          (prev - 1 + activeDeck.cards.length) %
                          activeDeck.cards.length
                      );
                    }}
                    className="rounded-full bg-white/75 p-3.5 text-purple-700 shadow-md border border-white/80 transition-all hover:bg-purple-50 active:scale-95"
                  >
                    <ArrowLeft size={22} />
                  </button>

                  <button
                    onClick={() => {
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="rounded-full bg-white/75 p-3.5 text-gray-500 shadow-md border border-white/80 transition-all hover:bg-white active:scale-95"
                    title="Học lại từ đầu"
                  >
                    <RotateCcw size={22} />
                  </button>

                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex(
                        (prev) => (prev + 1) % activeDeck.cards.length
                      );
                    }}
                    className="rounded-full bg-white/75 p-3.5 text-purple-700 shadow-md border border-white/80 transition-all hover:bg-purple-50 active:scale-95"
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {currentView === "edit" && activeDeck && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <button
              onClick={() => setCurrentView("home")}
              className="inline-flex items-center gap-2 rounded-full bg-white/45 px-4 py-2 font-bold text-purple-800 border border-white/80 backdrop-blur-xl transition-colors hover:text-purple-950"
            >
              <ArrowLeft size={18} /> Lưu & Quay lại trang chủ
            </button>

            <div className="rounded-[2rem] border border-white/80 bg-white/60 backdrop-blur-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-black text-gray-900 font-title">
                Thêm thẻ từ mới vào bộ:{" "}
                <span className="text-purple-700">{activeDeck.title}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">
                    Từ tiếng Hàn *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 사과"
                    value={newCard.korean}
                    onChange={(e) =>
                      setNewCard({ ...newCard, korean: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 font-medium text-lg outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">
                    Phiên âm Romaji
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: sagwa"
                    value={newCard.romaji}
                    onChange={(e) =>
                      setNewCard({ ...newCard, romaji: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">
                    Nghĩa tiếng Việt *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quả táo"
                    value={newCard.viet}
                    onChange={(e) =>
                      setNewCard({ ...newCard, viet: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 font-medium text-lg outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold uppercase text-gray-500">
                    Ghi chú / Ví dụ
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tôi thích ăn táo..."
                    value={newCard.note}
                    onChange={(e) =>
                      setNewCard({ ...newCard, note: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCard}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 py-3 font-bold text-white shadow-lg shadow-pink-200/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus size={18} /> Thêm vào bộ từ vựng
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="ml-1 text-xl font-black text-gray-900 font-title">
                Danh sách thẻ từ hiện có ({activeDeck.cards?.length || 0})
              </h3>

              {!activeDeck.cards || activeDeck.cards.length === 0 ? (
                <div className="rounded-[2rem] border border-white/80 bg-white/55 py-8 text-center font-medium text-gray-500 backdrop-blur-xl">
                  Chưa có thẻ từ nào trong bộ này. Hãy nhập mẫu phía trên để bắt
                  đầu.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeck.cards.map((card) => (
                    <div
                      key={card.id}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/60 px-6 py-4 backdrop-blur-xl transition-all hover:bg-white/75"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 items-center">
                        <span className="text-xl font-black text-purple-950">
                          {card.korean}
                        </span>
                        {card.romaji ? (
                          <span className="text-sm font-bold tracking-wide text-gray-400">
                            [{card.romaji}]
                          </span>
                        ) : (
                          <span className="hidden md:inline text-gray-300">
                            -
                          </span>
                        )}
                        <span className="font-title text-base font-bold text-gray-800">
                          {card.viet}
                        </span>
                      </div>

                      {card.note && (
                        <div className="hidden lg:block max-w-xs truncate rounded-lg border border-white/80 bg-white/60 px-3 py-1.5 text-xs text-gray-500">
                          {card.note}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Xóa thẻ từ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
