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
} from "lucide-react";
import axios from "axios";

// Đường dẫn API Backend kết nối tới database MongoDB Atlas của bạn
const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

export default function App() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home");
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // State quản lý Modal Welcome
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // State quản lý form nhập liệu
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });

  // --- STATE TÀI KHOẢN (Đã sửa lại đúng logic App.jsx cũ) ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("flashcard_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Tải dữ liệu khi vừa mở web hoặc khi user thay đổi
  useEffect(() => {
    fetchDecks();
  }, [user]);

  // --- HIỆU ỨNG CHUỘT (Bubble Gradient từ oldbutnogg) ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      const bubble = document.createElement("div");
      bubble.className =
        "pointer-events-none fixed w-8 h-8 rounded-full bg-gradient-to-r from-pink-300/40 to-purple-400/40 blur-md mix-blend-screen transition-all duration-700 ease-out z-50";
      bubble.style.left = `${e.clientX}px`;
      bubble.style.top = `${e.clientY}px`;
      bubble.style.transform = "translate(-50%, -50%) scale(1)";
      document.body.appendChild(bubble);

      requestAnimationFrame(() => {
        bubble.style.transform = "translate(-50%, -200%) scale(0)";
        bubble.style.opacity = "0";
      });

      setTimeout(() => {
        bubble.remove();
      }, 700);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // --- LOGIC API & GOOGLE LOGIN ---
  const fetchDecks = async () => {
    try {
      const emailToFetch = user ? user.email : "default";
      const response = await axios.get(`${API_URL}?userEmail=${emailToFetch}`);
      setDecks(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("flashcard_user");
  };

  const handleAddDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      const newDeckData = {
        title: newDeckTitle,
        cards: [],
        userEmail: user ? user.email : "default",
      };
      const response = await axios.post(API_URL, newDeckData);
      setDecks([...decks, response.data]);
      setNewDeckTitle("");
    } catch (error) {
      console.error("Lỗi khi thêm bộ từ vựng:", error);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    try {
      await axios.delete(`${API_URL}/${deckId}`);
      setDecks(decks.filter((d) => d._id !== deckId));
    } catch (error) {
      console.error("Lỗi khi xóa bộ từ:", error);
    }
  };

  const handleAddCard = async (deckId) => {
    if (!newCard.korean.trim() || !newCard.viet.trim()) return;
    try {
      setSaveStatus("saving");
      const currentDeck = decks.find((d) => d._id === deckId);
      const updatedDeckData = {
        ...currentDeck,
        cards: [
          ...currentDeck.cards,
          { ...newCard, id: Date.now().toString() },
        ],
      };

      const response = await axios.put(`${API_URL}/${deckId}`, updatedDeckData);
      setDecks(decks.map((d) => (d._id === deckId ? response.data : d)));
      setNewCard({ korean: "", romaji: "", viet: "", note: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi khi thêm từ vựng:", error);
      setSaveStatus("error");
    }
  };

  const handleDeleteCard = async (deckId, cardId) => {
    try {
      const currentDeck = decks.find((d) => d._id === deckId);
      const updatedDeckData = {
        ...currentDeck,
        cards: currentDeck.cards.filter((c) => c.id !== cardId),
      };

      const response = await axios.put(`${API_URL}/${deckId}`, updatedDeckData);
      setDecks(decks.map((d) => (d._id === deckId ? response.data : d)));
    } catch (error) {
      console.error("Lỗi khi xóa từ vựng:", error);
    }
  };

  const activeDeck = decks.find((d) => d._id === activeDeckId);

  // --- PHÍM TẮT ĐỂ HỌC ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        currentView !== "study" ||
        !activeDeck ||
        activeDeck.cards.length === 0
      )
        return;
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowRight") {
        setIsFlipped(false);
        setCardIndex((prev) => (prev + 1) % activeDeck.cards.length);
      } else if (e.key === "ArrowLeft") {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 font-sans selection:bg-purple-300 selection:text-purple-900 overflow-x-hidden">
      {/* --- WELCOME MODAL --- */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-white/20 transform transition-all">
            <h2 className="text-2xl font-black text-purple-800 mb-4 font-title">
              Xin chào! 👋
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed font-medium">
              Chào mừng bạn đến với góc học tập tiếng Hàn nhỏ xinh này. Chúc bạn
              học thật vui vẻ nhé!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all"
              >
                Bắt đầu học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTAINER --- */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white/40 p-6 rounded-3xl backdrop-blur-md shadow-sm border border-white/50">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 font-title mb-2">
              Korean Flashcards
            </h1>
            <p className="text-sm font-medium text-purple-600/80 bg-purple-100/50 inline-block px-3 py-1 rounded-full">
              Học từ vựng mỗi ngày ✨
            </p>
          </div>

          {/* User & Login Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 bg-white/60 pl-4 pr-2 py-2 rounded-full border border-white">
                <img
                  src={user.picture}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full ring-2 ring-purple-200"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-gray-800">{user.name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors ml-2"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="shadow-xl rounded-full overflow-hidden hover:scale-105 transition-transform">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log("Login Failed")}
                  theme="outline"
                  shape="pill"
                />
              </div>
            )}
          </div>
        </header>

        {/* --- TRANG CHỦ --- */}
        {currentView === "home" && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Create Deck Area */}
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white flex gap-3 items-center">
              <input
                type="text"
                placeholder="Nhập tên bộ từ vựng mới..."
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDeck()}
                className="flex-1 bg-white/80 border-0 px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium text-gray-700 placeholder-purple-300 outline-none"
              />
              <button
                onClick={handleAddDeck}
                disabled={!newDeckTitle.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all disabled:hover:shadow-none hover:scale-105 active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Deck List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {decks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-purple-400 font-medium bg-white/30 rounded-3xl border border-dashed border-purple-200">
                  Chưa có bộ từ vựng nào. Hãy tạo mới ở trên nhé!
                </div>
              ) : (
                decks.map((deck) => (
                  <div
                    key={deck._id}
                    className="group bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white hover:shadow-xl hover:shadow-purple-200/50 transition-all hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className="text-xl font-black text-gray-800 font-title mb-1 group-hover:text-purple-700 transition-colors">
                          {deck.title}
                        </h3>
                        <p className="text-sm font-medium text-purple-500 bg-purple-50 inline-block px-3 py-1 rounded-full mt-2">
                          {deck.cards?.length || 0} thẻ từ
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDeck(deck._id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Xóa bộ từ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex gap-3 mt-6 relative z-10">
                      <button
                        onClick={() => {
                          setActiveDeckId(deck._id);
                          setCurrentView("edit");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          if (!deck.cards || deck.cards.length === 0) {
                            alert("Vui lòng thêm từ vựng trước khi học!");
                            return;
                          }
                          setActiveDeckId(deck._id);
                          setCardIndex(0);
                          setIsFlipped(false);
                          setCurrentView("study");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                      >
                        <BookOpen size={18} /> Học ngay
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- CHẾ ĐỘ HỌC (STUDY) --- */}
        {currentView === "study" && activeDeck && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white shadow-sm">
              <button
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 transition-colors"
              >
                <ArrowLeft size={20} /> Thoát
              </button>
              <div className="text-center">
                <h2 className="text-lg font-black text-gray-800 font-title">
                  {activeDeck.title}
                </h2>
                <div className="text-sm font-bold text-purple-500">
                  {cardIndex + 1} / {activeDeck.cards.length}
                </div>
              </div>
              <div className="w-20"></div> {/* Spacer */}
            </div>

            {/* Thẻ từ lật 3D */}
            <div
              className="relative w-full aspect-[4/3] md:aspect-[16/9] cursor-pointer group [perspective:1000px]"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                  isFlipped ? "[transform:rotateX(180deg)]" : ""
                }`}
              >
                {/* Mặt trước (Hàn) */}
                <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-[2rem] shadow-xl border-2 border-purple-100 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white to-purple-50/50">
                  <div className="absolute top-6 right-6 text-purple-300">
                    <RotateCcw size={24} className="opacity-50" />
                  </div>
                  <span className="text-5xl md:text-7xl font-black text-purple-900 mb-6 drop-shadow-sm">
                    {activeDeck.cards[cardIndex].korean}
                  </span>
                  {activeDeck.cards[cardIndex].romaji && (
                    <span className="text-xl md:text-2xl font-bold text-purple-400 tracking-widest uppercase">
                      [{activeDeck.cards[cardIndex].romaji}]
                    </span>
                  )}
                </div>

                {/* Mặt sau (Việt) */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)] bg-gradient-to-br from-purple-600 to-pink-500 rounded-[2rem] shadow-xl shadow-purple-500/20 flex flex-col items-center justify-center p-8 text-center border border-white/20">
                  <div className="absolute top-6 right-6 text-white/50">
                    <RotateCcw size={24} />
                  </div>
                  <span className="text-4xl md:text-5xl font-black text-white font-title mb-6 drop-shadow-md">
                    {activeDeck.cards[cardIndex].viet}
                  </span>
                  {activeDeck.cards[cardIndex].note && (
                    <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl text-white/90 font-medium mt-4 max-w-xs text-sm md:text-base border border-white/10">
                      {activeDeck.cards[cardIndex].note}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Điều khiển chuyển thẻ */}
            <div className="flex justify-center items-center gap-6 mt-8">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex(
                    (prev) =>
                      (prev - 1 + activeDeck.cards.length) %
                      activeDeck.cards.length
                  );
                }}
                className="p-4 bg-white/80 backdrop-blur-sm text-purple-600 rounded-full shadow-sm hover:shadow-md hover:bg-white hover:text-purple-800 transition-all hover:-translate-x-1"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="text-sm font-medium text-gray-400 bg-white/50 px-4 py-2 rounded-full border border-white">
                Dùng{" "}
                <kbd className="font-sans px-2 py-1 bg-white rounded shadow-sm text-purple-600 font-bold mx-1">
                  Space
                </kbd>{" "}
                và{" "}
                <kbd className="font-sans px-2 py-1 bg-white rounded shadow-sm text-purple-600 font-bold mx-1">
                  ←
                </kbd>{" "}
                <kbd className="font-sans px-2 py-1 bg-white rounded shadow-sm text-purple-600 font-bold mx-1">
                  →
                </kbd>
              </div>

              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex((prev) => (prev + 1) % activeDeck.cards.length);
                }}
                className="p-4 bg-white/80 backdrop-blur-sm text-purple-600 rounded-full shadow-sm hover:shadow-md hover:bg-white hover:text-purple-800 transition-all hover:translate-x-1"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        )}

        {/* --- CHẾ ĐỘ CHỈNH SỬA (EDIT) --- */}
        {currentView === "edit" && activeDeck && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white shadow-sm">
              <button
                onClick={() => setCurrentView("home")}
                className="p-2 text-purple-600 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-gray-800 font-title flex-1">
                Chỉnh sửa:{" "}
                <span className="text-purple-600">{activeDeck.title}</span>
              </h2>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-lg border border-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">
                    Tiếng Hàn *
                  </label>
                  <input
                    type="text"
                    value={newCard.korean}
                    onChange={(e) =>
                      setNewCard({ ...newCard, korean: e.target.value })
                    }
                    className="w-full bg-white border-2 border-purple-100 px-4 py-3 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none transition-all font-medium text-lg"
                    placeholder="VD: 안녕하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">
                    Phiên âm (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={newCard.romaji}
                    onChange={(e) =>
                      setNewCard({ ...newCard, romaji: e.target.value })
                    }
                    className="w-full bg-white border-2 border-purple-100 px-4 py-3 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none transition-all font-medium"
                    placeholder="VD: annyeonghaseyo"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">
                    Nghĩa tiếng Việt *
                  </label>
                  <input
                    type="text"
                    value={newCard.viet}
                    onChange={(e) =>
                      setNewCard({ ...newCard, viet: e.target.value })
                    }
                    className="w-full bg-white border-2 border-purple-100 px-4 py-3 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none transition-all font-medium text-lg"
                    placeholder="VD: Xin chào"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">
                    Ghi chú / Ví dụ (Tùy chọn)
                  </label>
                  <textarea
                    value={newCard.note}
                    onChange={(e) =>
                      setNewCard({ ...newCard, note: e.target.value })
                    }
                    className="w-full bg-white border-2 border-purple-100 px-4 py-3 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none transition-all font-medium resize-none"
                    rows="2"
                    placeholder="Thêm ngữ cảnh hoặc ví dụ câu..."
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-4">
                {saveStatus === "saving" && (
                  <span className="text-purple-500 font-bold text-sm animate-pulse">
                    Đang lưu...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                    <Check size={16} /> Đã lưu
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                    <X size={16} /> Lỗi lưu
                  </span>
                )}
                <button
                  onClick={() => handleAddCard(activeDeck._id)}
                  disabled={!newCard.korean.trim() || !newCard.viet.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Save size={20} /> Thêm thẻ từ
                </button>
              </div>
            </div>

            {/* List of cards */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-purple-100/50 bg-white/40">
                <h3 className="font-bold text-gray-700">
                  Danh sách thẻ từ ({activeDeck.cards?.length || 0})
                </h3>
              </div>

              {!activeDeck.cards || activeDeck.cards.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-medium">
                  Chưa có thẻ từ nào trong bộ này.
                </div>
              ) : (
                <div className="divide-y divide-purple-100/50">
                  {activeDeck.cards.map((card) => (
                    <div
                      key={card.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-xl font-black text-purple-950">
                          {card.korean}
                        </span>
                        {card.romaji ? (
                          <span className="text-sm text-gray-400 font-bold tracking-wide">
                            [{card.romaji}]
                          </span>
                        ) : (
                          <span className="hidden md:inline text-gray-300">
                            -
                          </span>
                        )}
                        <span className="text-base font-bold text-gray-800 font-title">
                          {card.viet}
                        </span>
                      </div>

                      {card.note && (
                        <div className="hidden lg:block text-xs text-gray-500 bg-white/50 px-3 py-1.5 rounded-lg max-w-xs truncate border border-white">
                          {card.note}
                        </div>
                      )}

                      <button
                        onClick={() =>
                          handleDeleteCard(activeDeck._id, card.id)
                        }
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
