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
  // --- CÁC STATE QUẢN LÝ DỮ LIỆU VÀ GIAO DIỆN HIỆN TẠI ---
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home"); // "home" | "edit" | "study"
  const [activeDeckId, setActiveDeckId] = useState(null); // Lưu ID của bộ từ vựng đang chọn
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"

  // Modal Welcome
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // State quản lý thông tin đăng nhập cá nhân người dùng bằng Google
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("flashcard_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // State hỗ trợ tạo bộ từ vựng mới
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  // State hỗ trợ tạo/sửa thẻ từ vựng bên trong một bộ
  const [editingCards, setEditingCards] = useState([]);
  const [newCard, setNewCard] = useState({
    han: "",
    romaji: "",
    viet: "",
    note: "",
  });

  // Tham chiếu (Ref) để cuộn tự động
  const newCardInputRef = useRef(null);
  const cardsEndRef = useRef(null);

  // --- LẤY DỮ LIỆU TỪ MONGODB ---
  const fetchDecks = async () => {
    try {
      const emailToFetch = user ? user.email : "default";
      const response = await axios.get(`${API_URL}?email=${emailToFetch}`);
      setDecks(response.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu từ server:", error);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [user]);

  // --- CÁC HÀM XỬ LÝ (GIỮ NGUYÊN 100% LOGIC CŨ CỦA BẠN) ---
  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userInfo = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    };
    setUser(userInfo);
    localStorage.setItem("flashcard_user", JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("flashcard_user");
    setCurrentView("home");
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    try {
      const payload = {
        name: newDeckName,
        color: "bg-white",
        userEmail: user ? user.email : "default",
      };

      const response = await axios.post(API_URL, payload);
      setDecks([...decks, response.data]);
      setNewDeckName("");
      setIsCreatingDeck(false);
    } catch (error) {
      console.error("Lỗi khi tạo bộ từ vựng mới:", error);
      alert("Có lỗi xảy ra khi tạo bộ từ vựng. Vui lòng thử lại!");
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bộ từ vựng này không?")) {
      try {
        await axios.delete(`${API_URL}/${deckId}`);
        setDecks(decks.filter((deck) => deck._id !== deckId));
        if (activeDeckId === deckId) {
          setCurrentView("home");
        }
      } catch (error) {
        console.error("Lỗi khi xóa bộ từ vựng:", error);
      }
    }
  };

  const handleAddCard = () => {
    if (!newCard.han || !newCard.viet) return;

    const newCardWithId = {
      ...newCard,
      id: Date.now().toString(),
    };

    setEditingCards([...editingCards, newCardWithId]);
    setNewCard({ han: "", romaji: "", viet: "", note: "" });
    newCardInputRef.current?.focus();

    setTimeout(() => {
      cardsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDeleteCard = (cardId) => {
    setEditingCards(editingCards.filter((card) => card.id !== cardId));
  };

  const handleSaveDeck = async () => {
    setSaveStatus("saving");
    try {
      const response = await axios.put(`${API_URL}/${activeDeckId}`, {
        cards: editingCards,
      });

      setDecks(
        decks.map((deck) => (deck._id === activeDeckId ? response.data : deck))
      );
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("");
        setCurrentView("home");
      }, 1000);
    } catch (error) {
      console.error("Lỗi khi lưu từ vựng:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const startStudy = (deckId) => {
    const deck = decks.find((d) => d._id === deckId);
    if (!deck || !deck.cards || deck.cards.length === 0) {
      alert("Bộ này chưa có từ vựng nào! Vui lòng thêm từ vựng trước.");
      return;
    }
    setActiveDeckId(deckId);
    setCardIndex(0);
    setIsFlipped(false);
    setCurrentView("study");
  };

  const startEdit = (deckId) => {
    const deck = decks.find((d) => d._id === deckId);
    setActiveDeckId(deckId);
    setEditingCards(deck.cards ? [...deck.cards] : []);
    setCurrentView("edit");
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => {
        const deck = decks.find((d) => d._id === activeDeckId);
        return prev < (deck?.cards?.length || 0) - 1 ? prev + 1 : prev;
      });
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }, 150);
  };

  // Tính toán dữ liệu hiển thị chung
  const activeDeck = decks.find((d) => d._id === activeDeckId);
  const currentCardInfo = activeDeck?.cards?.[cardIndex];

  // --- GIAO DIỆN (JSX) ---
  return (
    <div className="min-h-screen bg-[#f1f2f6] font-sans pb-12">
      {/* KHÔI PHỤC WELCOME MODAL */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-sm">
          <div className="bg-[#f7d794] p-8 rounded-2xl w-[450px] max-w-[90%] shadow-2xl text-center border-4 border-[#574b90]">
            <h2 className="m-0 mb-4 text-[#574b90] text-2xl font-bold font-title">
              Welcome to Vocabulary Application
            </h2>
            <p className="m-0 mb-6 text-base text-[#2c3e50] leading-relaxed">
              This is an application to store and learn Korean vocabulary. You
              can create vocabulary lists, study, and play games with them.
              Let's start learning now!
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-[#cf6a87] text-white border-none py-2.5 px-8 rounded-xl cursor-pointer text-base font-bold transition-transform hover:scale-105 shadow-md"
                onClick={() => setShowWelcomeModal(false)}
              >
                Continue
              </button>
              <button
                className="bg-white text-[#574b90] border-2 border-[#574b90] py-2.5 px-8 rounded-xl cursor-pointer text-base font-bold transition-transform hover:scale-105 shadow-md"
                onClick={() => setShowWelcomeModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER GIAO DIỆN MÀU CŨ */}
      <header className="sticky top-0 z-50 bg-[#574b90] text-white shadow-lg border-b border-[#574b90]/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen size={20} className="text-[#f7d794]" />
            </div>
            <h1
              className="text-xl font-bold tracking-tight cursor-pointer font-title text-[#f7d794]"
              onClick={() => setCurrentView("home")}
            >
              Korean Flashcards
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-[#f7d794]">
                    {user.name}
                  </span>
                  <span className="text-xs text-white/70">{user.email}</span>
                </div>
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border-2 border-[#f7d794] shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:text-[#f7d794] hover:bg-white/10 rounded-lg transition-colors ml-2"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="transform scale-90 sm:scale-100 origin-right">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.log("Login Failed")}
                  theme="outline"
                  shape="pill"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {currentView === "home" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Thanh điều khiển trên cùng (Thêm bộ mới) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex-1 w-full">
                {!user && (
                  <p className="text-sm text-[#cf6a87] font-medium flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#cf6a87] animate-pulse"></span>
                    Bạn đang xem danh sách từ vựng dùng chung. Hãy đăng nhập để
                    tạo bộ từ vựng cá nhân!
                  </p>
                )}
                <h2 className="text-2xl font-bold text-[#574b90]">
                  Bộ Từ Vựng Của Bạn
                </h2>
              </div>

              {user && (
                <div className="w-full sm:w-auto">
                  {isCreatingDeck ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        placeholder="Tên bộ từ vựng mới..."
                        className="flex-1 sm:w-64 px-4 py-2 border border-[#574b90]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#574b90] bg-white text-gray-800"
                        autoFocus
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateDeck()
                        }
                      />
                      <button
                        onClick={handleCreateDeck}
                        className="px-4 py-2 bg-[#574b90] text-white rounded-xl hover:bg-[#574b90]/90 transition-colors font-medium shadow-sm"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingDeck(false);
                          setNewDeckName("");
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingDeck(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#574b90] text-white rounded-xl hover:bg-[#574b90]/90 transition-all font-medium shadow-sm hover:shadow-md"
                    >
                      <Plus size={18} />
                      Tạo bộ mới
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Lưới danh sách bộ từ vựng - ÁP DỤNG MÀU CŨ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                  Chưa có bộ từ vựng nào.
                </div>
              ) : (
                decks.map((deck) => (
                  <div
                    key={deck._id}
                    className="group bg-[#f7d794] border-2 border-[#574b90] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-[220px]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-[#574b90] group-hover:text-[#cf6a87] transition-colors line-clamp-2">
                        {deck.name}
                      </h3>
                      {user && user.email === deck.userEmail && (
                        <button
                          onClick={() => handleDeleteDeck(deck._id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Xóa bộ từ vựng này"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="text-sm text-[#2c3e50] font-medium mb-auto">
                      {deck.cards ? deck.cards.length : 0} thuật ngữ
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[#574b90]/20">
                      <button
                        onClick={() => startStudy(deck._id)}
                        className="flex-1 bg-[#574b90] text-white py-2.5 rounded-xl font-medium transition-all hover:bg-[#574b90]/90 shadow-sm hover:shadow active:scale-95"
                      >
                        Học ngay
                      </button>
                      {user && user.email === deck.userEmail && (
                        <button
                          onClick={() => startEdit(deck._id)}
                          className="px-4 py-2.5 bg-[#cf6a87] text-white rounded-xl hover:bg-[#cf6a87]/90 transition-all font-medium active:scale-95 shadow-sm"
                          title="Thêm/Sửa từ vựng"
                        >
                          Sửa
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === "study" && activeDeck && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-2 text-gray-500 hover:text-[#574b90] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <ArrowLeft size={18} /> Trở về
              </button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#574b90]">
                  {activeDeck.name}
                </h2>
                <div className="text-sm font-medium text-[#cf6a87]">
                  Thẻ {cardIndex + 1} / {activeDeck.cards?.length || 0}
                </div>
              </div>
              <div className="w-[88px]"></div>
            </div>

            {currentCardInfo && (
              <div className="space-y-8">
                {/* Thanh tiến trình */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#cf6a87] transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        ((cardIndex + 1) / activeDeck.cards.length) * 100
                      }%`,
                    }}
                  />
                </div>

                {/* Thẻ học - ÁP DỤNG MÀU CŨ */}
                <div
                  className="relative w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer group"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div
                    className={`absolute w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-3xl ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* Mặt trước */}
                    <div className="absolute w-full h-full backface-hidden bg-[#f7d794] border-2 border-[#574b90] rounded-3xl flex flex-col items-center justify-center p-8">
                      <div className="absolute top-4 right-4 text-xs font-bold text-[#574b90]/50 tracking-wider">
                        BẤM ĐỂ LẬT
                      </div>
                      <span className="text-6xl md:text-8xl font-bold text-[#574b90] mb-6 drop-shadow-sm font-title">
                        {currentCardInfo.han}
                      </span>
                      {currentCardInfo.romaji && (
                        <span className="text-xl md:text-2xl text-[#2c3e50] font-medium tracking-widest">
                          [{currentCardInfo.romaji}]
                        </span>
                      )}
                    </div>

                    {/* Mặt sau */}
                    <div className="absolute w-full h-full backface-hidden bg-white border-2 border-[#cf6a87] rounded-3xl flex flex-col items-center justify-center p-8 rotate-y-180">
                      <span className="text-4xl md:text-5xl font-bold text-[#cf6a87] mb-6 text-center leading-tight font-title">
                        {currentCardInfo.viet}
                      </span>
                      {currentCardInfo.note && (
                        <p className="text-lg md:text-xl text-gray-500 mt-4 text-center max-w-lg bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <span className="font-semibold block mb-1 text-sm text-gray-400 uppercase">
                            Ghi chú
                          </span>
                          {currentCardInfo.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút điều hướng */}
                <div className="flex justify-center items-center gap-6">
                  <button
                    onClick={handlePrevCard}
                    disabled={cardIndex === 0}
                    className="p-4 rounded-full bg-white text-[#574b90] disabled:text-gray-300 shadow-md hover:shadow-lg hover:-translate-x-1 disabled:hover:translate-x-0 transition-all border border-gray-100 disabled:border-transparent"
                  >
                    <ArrowLeft size={28} />
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="p-4 rounded-full bg-[#f7d794] text-[#574b90] shadow-md hover:shadow-lg hover:rotate-180 transition-all duration-300 border border-[#574b90]/20"
                  >
                    <RotateCcw size={24} />
                  </button>

                  <button
                    onClick={handleNextCard}
                    disabled={cardIndex === activeDeck.cards.length - 1}
                    className="p-4 rounded-full bg-[#574b90] text-white disabled:bg-gray-200 disabled:text-gray-400 shadow-md hover:shadow-lg hover:translate-x-1 disabled:hover:translate-x-0 transition-all"
                  >
                    <ArrowRight size={28} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === "edit" && activeDeck && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500">
            {/* Header của chế độ Edit */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 sticky top-20 z-40">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("home")}
                  className="p-2 text-gray-400 hover:text-[#574b90] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-[#574b90]">
                    Đang sửa: {activeDeck.name}
                  </h2>
                  <span className="text-sm font-medium text-[#cf6a87]">
                    {editingCards.length} thuật ngữ
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveDeck}
                disabled={saveStatus === "saving"}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all w-full sm:w-auto shadow-sm ${
                  saveStatus === "saved"
                    ? "bg-green-500"
                    : saveStatus === "error"
                    ? "bg-red-500"
                    : "bg-[#cf6a87] hover:bg-[#cf6a87]/90 active:scale-95"
                }`}
              >
                {saveStatus === "saving" ? (
                  <span className="animate-pulse">Đang lưu...</span>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check size={18} /> Đã lưu!
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <X size={18} /> Lỗi lưu!
                  </>
                ) : (
                  <>
                    <Save size={18} /> Lưu bộ từ vựng
                  </>
                )}
              </button>
            </div>

            <div className="space-y-8">
              {/* Form thêm từ mới - Đắp màu cũ */}
              <div className="bg-[#f7d794] border-2 border-[#574b90] p-6 sm:p-8 rounded-3xl shadow-md">
                <h3 className="text-lg font-bold text-[#574b90] mb-6 flex items-center gap-2 font-title">
                  <div className="w-2 h-6 bg-[#cf6a87] rounded-full"></div>
                  Thêm từ mới
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#574b90]">
                      Tiếng Hàn *
                    </label>
                    <input
                      ref={newCardInputRef}
                      type="text"
                      value={newCard.han}
                      onChange={(e) =>
                        setNewCard({ ...newCard, han: e.target.value })
                      }
                      placeholder="Ví dụ: 안녕하세요"
                      className="w-full px-4 py-3 bg-white border border-[#574b90]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#574b90] text-lg text-[#2c3e50]"
                      onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#574b90]">
                      Cách đọc (Romaji/Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={newCard.romaji}
                      onChange={(e) =>
                        setNewCard({ ...newCard, romaji: e.target.value })
                      }
                      placeholder="Ví dụ: annyeonghaseyo"
                      className="w-full px-4 py-3 bg-white border border-[#574b90]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#574b90] text-[#2c3e50]"
                      onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-[#574b90]">
                      Nghĩa Tiếng Việt *
                    </label>
                    <input
                      type="text"
                      value={newCard.viet}
                      onChange={(e) =>
                        setNewCard({ ...newCard, viet: e.target.value })
                      }
                      placeholder="Ví dụ: Xin chào"
                      className="w-full px-4 py-3 bg-white border border-[#574b90]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#574b90] text-lg text-[#2c3e50]"
                      onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-[#574b90]">
                      Ghi chú (Tùy chọn)
                    </label>
                    <textarea
                      value={newCard.note}
                      onChange={(e) =>
                        setNewCard({ ...newCard, note: e.target.value })
                      }
                      placeholder="Ví dụ cách dùng, ngữ pháp liên quan..."
                      className="w-full px-4 py-3 bg-white border border-[#574b90]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#574b90] text-[#2c3e50] resize-none h-24"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddCard}
                  className="w-full py-4 border-2 border-dashed border-[#574b90] text-[#574b90] rounded-xl font-bold hover:bg-[#574b90] hover:text-white transition-all flex items-center justify-center gap-2 group text-lg"
                >
                  <Plus
                    size={24}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  Thêm thẻ này vào bộ
                </button>
              </div>

              {/* Danh sách từ đang sửa */}
              {editingCards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-[#574b90] mb-4 flex items-center gap-2">
                    <div className="w-2 h-6 bg-[#cf6a87] rounded-full"></div>
                    Danh sách đã thêm
                  </h3>
                  {editingCards.map((card, idx) => (
                    <div
                      key={card.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-[#574b90]/30 transition-colors gap-4"
                    >
                      <div className="flex flex-wrap items-center gap-3 md:gap-6 flex-1 w-full">
                        <span className="text-sm font-bold text-gray-300 w-6">
                          {idx + 1}
                        </span>
                        <span className="text-xl font-bold text-[#574b90] font-title">
                          {card.han}
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
                        <span className="text-base font-bold text-gray-800">
                          {card.viet}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {card.note && (
                          <div className="hidden lg:block text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg max-w-xs truncate border border-gray-100">
                            {card.note}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 text-gray-400 hover:text-[#cf6a87] hover:bg-[#cf6a87]/10 rounded-lg transition-colors"
                          title="Xóa thẻ từ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div ref={cardsEndRef} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
