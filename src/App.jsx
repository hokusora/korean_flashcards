import React, { useState, useEffect } from "react";
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

// ĐƯỜNG DẪN API BACKEND CỦA BẠN (TỪ FILE APP.JSX CHUẨN)
const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

export default function App() {
  // === STATE QUẢN LÝ DỮ LIỆU ===
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home"); // "home" | "edit" | "study"
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // === STATE GIAO DIỆN (TỪ OLDBUTNOGG) ===
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Hiệu ứng bubble lan tỏa

  // === STATE FORM NHẬP LIỆU ===
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });

  // === STATE TÀI KHOẢN (LOGIC APP.JSX CHUẨN) ===
  const [user, setUser] = useState(null);

  // Hiệu ứng chuột Bubble Gradient
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // === LOGIC ĐĂNG NHẬP GOOGLE & FETCH DATA CỦA APP.JSX ===
  const handleLoginSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    });
    fetchDecks(decoded.email);
  };

  const handleLogout = () => {
    setUser(null);
    setDecks([]);
    setCurrentView("home");
  };

  const fetchDecks = async (email) => {
    try {
      const response = await axios.get(`${API_URL}?email=${email}`);
      setDecks(response.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  };

  // Tải dữ liệu lại mỗi khi có thay đổi User
  useEffect(() => {
    if (user) {
      fetchDecks(user.email);
    }
  }, [user]);

  // === LOGIC XỬ LÝ DB (DECK & THẺ TỪ APP.JSX) ===
  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    if (!user) {
      alert("Vui lòng đăng nhập để tạo bộ từ vựng cá nhân!");
      return;
    }
    try {
      const response = await axios.post(API_URL, {
        title: newDeckTitle,
        color: "bg-white/40", // Màu thẻ Glassmorphism mặc định
        userEmail: user.email,
        cards: [],
      });
      setDecks([...decks, response.data]);
      setNewDeckTitle("");
    } catch (error) {
      console.error("Lỗi khi tạo deck:", error);
    }
  };

  const handleDeleteDeck = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bộ từ vựng này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setDecks(decks.filter((deck) => deck._id !== id));
      if (activeDeckId === id) {
        setCurrentView("home");
        setActiveDeckId(null);
      }
    } catch (error) {
      console.error("Lỗi khi xóa deck:", error);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.korean || !newCard.viet) return;
    try {
      setSaveStatus("saving");
      const activeDeck = decks.find((d) => d._id === activeDeckId);
      const updatedCards = [
        ...activeDeck.cards,
        { ...newCard, id: Date.now().toString() },
      ];

      await axios.put(`${API_URL}/${activeDeckId}`, {
        cards: updatedCards,
      });

      setDecks(
        decks.map((deck) =>
          deck._id === activeDeckId ? { ...deck, cards: updatedCards } : deck
        )
      );

      setNewCard({ korean: "", romaji: "", viet: "", note: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi khi thêm thẻ:", error);
      setSaveStatus("error");
    }
  };

  const handleDeleteCard = async (deckId, cardId) => {
    try {
      const activeDeck = decks.find((d) => d._id === deckId);
      const updatedCards = activeDeck.cards.filter((c) => c.id !== cardId);

      await axios.put(`${API_URL}/${deckId}`, {
        cards: updatedCards,
      });

      setDecks(
        decks.map((deck) =>
          deck._id === deckId ? { ...deck, cards: updatedCards } : deck
        )
      );
    } catch (error) {
      console.error("Lỗi khi xóa thẻ:", error);
    }
  };

  // === ĐIỀU HƯỚNG VÀ HỖ TRỢ HỌC (KEYBOARD) ===
  const activeDeck = decks.find((d) => d._id === activeDeckId);

  const startStudy = (deckId) => {
    setActiveDeckId(deckId);
    setCardIndex(0);
    setIsFlipped(false);
    setCurrentView("study");
  };

  const editDeck = (deckId) => {
    setActiveDeckId(deckId);
    setCurrentView("edit");
  };

  const nextCard = () => {
    if (activeDeck && cardIndex < activeDeck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCardIndex(cardIndex + 1), 150);
    }
  };

  const prevCard = () => {
    if (cardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCardIndex(cardIndex - 1), 150);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentView !== "study") return;
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (e.key === "ArrowRight") {
        nextCard();
      } else if (e.key === "ArrowLeft") {
        prevCard();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, isFlipped, cardIndex, activeDeck]);

  return (
    <div className="min-h-screen font-sans text-gray-800 relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      {/* HIỆU ỨNG CHUỘT BUBBLE GRADIENT */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply transition-transform duration-300 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 182, 193, 0.4), transparent 40%)`,
        }}
      />

      {/* WELCOME MODAL GLASSMORPHISM */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-purple-400"></div>
            <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold font-title text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2">
              Xin chào!
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Chào mừng bạn đến với Hokusora Flashcards. Hãy đăng nhập để tạo
              góc học tập tiếng Hàn của riêng bạn với giao diện trong trẻo và
              mềm mại nhé!
            </p>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 transition-all transform hover:scale-[1.02]"
            >
              Bắt đầu khám phá
            </button>
          </div>
        </div>
      )}

      {/* PHẦN NỘI DUNG CHÍNH */}
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">
        {/* HEADER: TITLE & LOGIC ĐĂNG NHẬP */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/30 backdrop-blur-md border border-white/50 p-4 md:p-6 rounded-3xl shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold font-title text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4 md:mb-0 flex items-center gap-3">
            <Sparkles className="text-pink-500" /> Hokusora Flashcards
          </h1>

          <div className="flex items-center gap-4">
            {!user ? (
              <div className="overflow-hidden rounded-full shadow-lg border-2 border-white/50">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log("Login Failed")}
                  useOneTap
                  theme="outline"
                  shape="pill"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-md">
                <img
                  src={user.picture}
                  alt="avatar"
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="font-semibold text-gray-700 hidden sm:block">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors ml-2"
                  title="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MÀN HÌNH CHÍNH (HOME) */}
        {currentView === "home" && (
          <div className="space-y-8 animate-fade-in">
            {/* THÊM DECK MỚI */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="text"
                placeholder="Nhập tên bộ từ vựng mới (Vd: TOPIK II, Từ vựng bài 1...)"
                className="flex-1 bg-white/60 border border-white focus:outline-none focus:ring-2 focus:ring-pink-300 rounded-2xl px-5 py-3 text-gray-700 placeholder-gray-400 font-medium w-full"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateDeck()}
              />
              <button
                onClick={handleCreateDeck}
                className="w-full sm:w-auto bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-all transform hover:scale-105"
              >
                <Plus size={20} /> Tạo Bộ Từ
              </button>
            </div>

            {/* DANH SÁCH DECK */}
            {!user ? (
              <div className="text-center py-16 bg-white/30 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg">
                <p className="text-gray-500 text-lg font-medium">
                  Vui lòng đăng nhập để xem và tạo từ vựng của bạn.
                </p>
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-16 bg-white/30 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg">
                <p className="text-gray-500 text-lg font-medium">
                  Bạn chưa có bộ từ vựng nào. Hãy tạo bộ đầu tiên ở trên nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    className="group bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold font-title text-gray-800">
                        {deck.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDeck(deck._id);
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-purple-600 bg-purple-100/50 inline-block px-3 py-1 rounded-full mb-6 border border-purple-200">
                      {deck.cards.length} thẻ từ
                    </p>
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => startStudy(deck._id)}
                        disabled={deck.cards.length === 0}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all shadow-md ${
                          deck.cards.length === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-pink-600 hover:bg-pink-50 border border-pink-100"
                        }`}
                      >
                        <BookOpen size={18} /> Học ngay
                      </button>
                      <button
                        onClick={() => editDeck(deck._id)}
                        className="px-4 py-3 bg-white/60 hover:bg-white text-gray-600 rounded-2xl font-bold border border-white/50 transition-all shadow-md"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHẾ ĐỘ HỌC (STUDY MODE - 3D FLIP TỪ OLDBUTNOGG) */}
        {currentView === "study" && activeDeck && (
          <div className="animate-fade-in max-w-3xl mx-auto mt-4">
            <button
              onClick={() => setCurrentView("home")}
              className="mb-6 flex items-center gap-2 text-gray-600 hover:text-pink-600 font-bold transition-colors bg-white/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/50 shadow-sm inline-flex"
            >
              <ArrowLeft size={20} /> Quay lại
            </button>

            <div className="mb-6 flex justify-between items-end">
              <h2 className="text-3xl font-bold font-title text-gray-800">
                {activeDeck.title}
              </h2>
              <span className="text-sm font-bold text-purple-600 bg-purple-100/50 px-4 py-1.5 rounded-full border border-purple-200">
                {cardIndex + 1} / {activeDeck.cards.length}
              </span>
            </div>

            {/* VÙNG CHỨA THẺ 3D */}
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[16/9] [perspective:1000px] mb-8 group cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`w-full h-full relative duration-500 [transform-style:preserve-3d] transition-transform ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* MẶT TRƯỚC (TIẾNG HÀN) */}
                <div className="absolute w-full h-full bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-[2rem] shadow-2xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden]">
                  <p className="text-sm font-bold text-pink-400 mb-4 tracking-widest uppercase">
                    Từ vựng
                  </p>
                  <h3 className="text-6xl sm:text-7xl font-black text-gray-800 mb-6 drop-shadow-sm font-sans text-center leading-tight">
                    {activeDeck.cards[cardIndex].korean}
                  </h3>
                  {activeDeck.cards[cardIndex].romaji && (
                    <p className="text-xl text-gray-400 font-medium">
                      [{activeDeck.cards[cardIndex].romaji}]
                    </p>
                  )}
                  <p className="absolute bottom-6 text-gray-300 text-sm flex items-center gap-2">
                    <RotateCcw size={14} /> Chạm hoặc Space để lật
                  </p>
                </div>

                {/* MẶT SAU (TIẾNG VIỆT) */}
                <div className="absolute w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 backdrop-blur-2xl border-2 border-white/80 rounded-[2rem] shadow-2xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-sm font-bold text-purple-400 mb-4 tracking-widest uppercase">
                    Nghĩa Tiếng Việt
                  </p>
                  <h3 className="text-4xl sm:text-5xl font-bold font-title text-purple-900 mb-6 text-center leading-relaxed">
                    {activeDeck.cards[cardIndex].viet}
                  </h3>
                  {activeDeck.cards[cardIndex].note && (
                    <div className="mt-4 p-4 bg-white/60 border border-white/80 rounded-2xl w-full max-w-md shadow-sm">
                      <p className="text-sm text-gray-500 font-bold mb-1 uppercase text-center">
                        Ghi chú
                      </p>
                      <p className="text-gray-700 text-center italic">
                        {activeDeck.cards[cardIndex].note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ĐIỀU HƯỚNG BÀI HỌC */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={prevCard}
                disabled={cardIndex === 0}
                className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 text-gray-600 hover:text-pink-600 hover:bg-white disabled:opacity-30 transition-all shadow-md hover:scale-105"
              >
                <ArrowLeft size={24} />
              </button>
              <button
                onClick={nextCard}
                disabled={cardIndex === activeDeck.cards.length - 1}
                className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 text-gray-600 hover:text-pink-600 hover:bg-white disabled:opacity-30 transition-all shadow-md hover:scale-105"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        )}

        {/* CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) */}
        {currentView === "edit" && activeDeck && (
          <div className="animate-fade-in max-w-5xl mx-auto bg-white/40 backdrop-blur-xl border border-white/50 p-6 md:p-8 rounded-[2rem] shadow-2xl">
            <div className="flex justify-between items-center mb-8 border-b border-white/50 pb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("home")}
                  className="p-2 bg-white/60 hover:bg-white rounded-xl text-gray-500 hover:text-pink-600 transition-colors shadow-sm"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-3xl font-bold font-title text-gray-800">
                  Sửa: {activeDeck.title}
                </h2>
              </div>
              <span className="bg-white/60 px-4 py-2 rounded-xl text-purple-600 font-bold border border-white">
                Tổng: {activeDeck.cards.length} thẻ
              </span>
            </div>

            {/* FORM THÊM TỪ MỚI */}
            <div className="bg-white/60 rounded-3xl p-6 mb-10 shadow-inner border border-white/80 relative">
              <h3 className="text-lg font-bold text-pink-600 mb-4 flex items-center gap-2">
                <Plus size={20} /> Thêm Thẻ Mới
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-2">
                    Từ Tiếng Hàn *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/80 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-300 shadow-sm"
                    value={newCard.korean}
                    onChange={(e) =>
                      setNewCard({ ...newCard, korean: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-2">
                    Phiên âm (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/80 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-300 shadow-sm"
                    value={newCard.romaji}
                    onChange={(e) =>
                      setNewCard({ ...newCard, romaji: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-2">
                    Nghĩa Tiếng Việt *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/80 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-300 shadow-sm"
                    value={newCard.viet}
                    onChange={(e) =>
                      setNewCard({ ...newCard, viet: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-2">
                    Ghi chú (Ví dụ, Loại từ...)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white/80 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-300 shadow-sm"
                    value={newCard.note}
                    onChange={(e) =>
                      setNewCard({ ...newCard, note: e.target.value })
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleAddCard()}
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-4">
                {saveStatus === "saving" && (
                  <span className="text-blue-500 flex items-center gap-1">
                    <RotateCcw size={16} className="animate-spin" /> Đang lưu...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-green-500 flex items-center gap-1">
                    <Check size={16} /> Đã lưu!
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-500 flex items-center gap-1">
                    <X size={16} /> Lỗi lưu
                  </span>
                )}

                <button
                  onClick={handleAddCard}
                  className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-pink-200 transition-transform transform hover:scale-105"
                >
                  <Save size={18} /> Thêm Thẻ
                </button>
              </div>
            </div>

            {/* DANH SÁCH THẺ HIỆN TẠI */}
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                Danh Sách Thẻ Trong Bộ
              </h3>
              {activeDeck.cards.length === 0 ? (
                <div className="text-center py-10 bg-white/30 rounded-2xl border border-white/50 border-dashed">
                  <p className="text-gray-400 italic">
                    Chưa có thẻ nào. Hãy thêm từ vựng mới ở trên nhé!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeck.cards.map((card, idx) => (
                    <div
                      key={card.id}
                      className="group bg-white/60 hover:bg-white backdrop-blur-sm border border-white/80 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-6 overflow-hidden">
                        <span className="text-gray-400 font-bold w-6 text-center">
                          {idx + 1}
                        </span>
                        <div className="flex gap-4 items-baseline min-w-0">
                          <span className="text-xl font-black text-purple-900 truncate">
                            {card.korean}
                          </span>
                          <span className="text-sm font-bold text-gray-800 font-title truncate">
                            {card.viet}
                          </span>
                          {card.romaji && (
                            <span className="hidden md:inline text-xs text-gray-400 font-bold tracking-wide border border-gray-200 px-2 py-0.5 rounded-md">
                              {card.romaji}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleDeleteCard(activeDeck._id, card.id)
                        }
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
