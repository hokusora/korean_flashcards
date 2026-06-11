import React, { useState, useEffect, useRef, useCallback } from "react";
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
  CheckSquare,
  Loader2,
} from "lucide-react";
import axios from "axios";

// Đảm bảo API liên kết với Backend Render của bạn
const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

export default function App() {
  // --- CÁC STATE QUẢN LÝ DỮ LIỆU VÀ GIAO DIỆN ---
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home");
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "saving" | "saved" | "error" | ""

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

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. Logic Hiệu ứng chuột (Bubble Gradient)
  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 2. Logic Lấy dữ liệu từ MongoDB an toàn
  const fetchDecks = useCallback(async () => {
    try {
      setSaveStatus("saving");
      const emailToFetch = user ? user.email : "default";
      const res = await axios.get(`${API_URL}?userEmail=${emailToFetch}`);
      setDecks(res.data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      setSaveStatus("error");
    }
  }, [user]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // 3. Phím tắt Keyboard (Space để lật, Arrow để Next/Prev)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentView !== "study" || !activeDeckId) return;
      const deck = decks.find((d) => d._id === activeDeckId);
      if (!deck || !deck.cards || deck.cards.length === 0) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        if (cardIndex < deck.cards.length - 1) {
          setCardIndex((prev) => prev + 1);
          setIsFlipped(false);
        }
      } else if (e.code === "ArrowLeft") {
        if (cardIndex > 0) {
          setCardIndex((prev) => prev - 1);
          setIsFlipped(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, activeDeckId, decks, cardIndex]);

  // 4. Logic Đăng Nhập / Đăng Xuất
  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
    setUser(userData);
    localStorage.setItem("flashcard_user", JSON.stringify(userData));
    setShowWelcomeModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("flashcard_user");
    setDecks([]);
    setCurrentView("home");
  };

  // 5. FIX LỖI DATABASE: Tạo bộ từ vựng (Lưu đúng _id trả về từ MongoDB)
  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      setSaveStatus("saving");
      const userEmail = user ? user.email : "default";
      const payload = {
        title: newDeckTitle,
        color: "bg-white/40",
        userEmail: userEmail,
        cards: [],
      };
      const res = await axios.post(API_URL, payload);
      // Bắt buộc lấy res.data để lấy mã _id gốc từ MongoDB
      setDecks((prev) => [...prev, res.data]);
      setNewDeckTitle("");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi tạo bộ từ:", error);
      setSaveStatus("error");
      alert("Lỗi khi lưu bộ từ vựng vào Database!");
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ từ vựng này không?"))
      return;
    try {
      setSaveStatus("saving");
      await axios.delete(`${API_URL}/${deckId}`);
      setDecks((prev) => prev.filter((d) => d._id !== deckId));
      if (activeDeckId === deckId) setCurrentView("home");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi xóa bộ từ:", error);
      setSaveStatus("error");
    }
  };

  // 6. FIX LỖI DATABASE: Thêm thẻ từ mới
  const handleAddCard = async () => {
    if (!newCard.korean || !newCard.viet) {
      alert("Vui lòng nhập tối thiểu tiếng Hàn và nghĩa tiếng Việt!");
      return;
    }
    try {
      setSaveStatus("saving");
      // Dùng activeDeckId (đã được fix để luôn tồn tại nhờ hàm CreateDeck chuẩn)
      const res = await axios.put(`${API_URL}/${activeDeckId}/cards`, newCard);
      // Ghi đè lại deck cũ bằng deck mới (chứa mảng thẻ đã update _id từ DB)
      setDecks((prev) =>
        prev.map((d) => (d._id === activeDeckId ? res.data : d))
      );
      setNewCard({ korean: "", romaji: "", viet: "", note: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi thêm thẻ:", error);
      setSaveStatus("error");
    }
  };

  // 7. Logic Xóa một thẻ từ cụ thể trong Edit Mode
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Xóa thẻ từ này khỏi danh sách?")) return;
    try {
      setSaveStatus("saving");
      const currentDeck = decks.find((d) => d._id === activeDeckId);
      // Lọc bỏ thẻ bị xóa
      const updatedCards = currentDeck.cards.filter(
        (c) => (c._id || c.id) !== cardId
      );

      // Update lại toàn bộ mảng thẻ của Deck lên MongoDB
      const res = await axios.put(`${API_URL}/${activeDeckId}`, {
        ...currentDeck,
        cards: updatedCards,
      });

      setDecks((prev) =>
        prev.map((d) => (d._id === activeDeckId ? res.data : d))
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi xóa thẻ:", error);
      setSaveStatus("error");
    }
  };

  // 8. TÍNH NĂNG MỚI: Checkbox Đã học
  const handleMarkAsLearned = async (card) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu từ này vào danh sách 'Đã học' nhé!");
      return;
    }
    try {
      setSaveStatus("saving");
      let learnedDeck = decks.find(
        (d) => d.title === "Đã học ✅" && d.userEmail === user.email
      );

      if (!learnedDeck) {
        const createRes = await axios.post(API_URL, {
          title: "Đã học ✅",
          color: "bg-green-50/60",
          userEmail: user.email,
        });
        learnedDeck = createRes.data;
        setDecks((prev) => [...prev, learnedDeck]);
      }

      const isAlreadyLearned = learnedDeck.cards?.some(
        (c) => c.korean === card.korean
      );
      if (isAlreadyLearned) {
        alert("Từ này đã nằm trong bộ Đã học rồi!");
        setSaveStatus("");
        return;
      }

      const updateRes = await axios.put(`${API_URL}/${learnedDeck._id}/cards`, {
        korean: card.korean,
        romaji: card.romaji,
        viet: card.viet,
        note: card.note,
      });

      setDecks((prev) =>
        prev.map((d) => (d._id === learnedDeck._id ? updateRes.data : d))
      );
      setSaveStatus("saved");
      alert("✨ Đã thêm vào danh sách Đã học!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi khi lưu từ đã học:", error);
      setSaveStatus("error");
    }
  };

  // Hàm render hiển thị trạng thái đồng bộ
  const renderSaveStatus = () => {
    if (saveStatus === "saving")
      return (
        <span className="flex items-center gap-1 text-blue-500 font-medium text-sm bg-white/60 px-3 py-1 rounded-full">
          <Loader2 className="animate-spin" size={14} /> Đang đồng bộ...
        </span>
      );
    if (saveStatus === "saved")
      return (
        <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-white/60 px-3 py-1 rounded-full">
          <Check size={14} /> Đã lưu an toàn
        </span>
      );
    if (saveStatus === "error")
      return (
        <span className="flex items-center gap-1 text-red-500 font-medium text-sm bg-white/60 px-3 py-1 rounded-full">
          <X size={14} /> Lỗi kết nối Database
        </span>
      );
    return null;
  };

  const activeDeck = decks.find((d) => d._id === activeDeckId);

  return (
    // [MÀU SẮC BẠN CUSTOM] - Đổi lại bg-gradient-to-br theo mã của bạn
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 font-sans">
      {/* Hiệu ứng Bubble Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,182,193,0.3), transparent 40%)`,
        }}
      />

      {/* Modal Welcome */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          {/* [MÀU SẮC BẠN CUSTOM] Khung nền thẻ (bg-white/60) */}
          <div className="bg-white/60 backdrop-blur-2xl border border-white/50 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            {/* [MÀU SẮC BẠN CUSTOM] Đổi text-pink-500 thành màu bạn muốn */}
            <h2 className="text-4xl font-bold font-title text-pink-500 mb-4 tracking-wide">
              Annyeong! 🌸
            </h2>
            <p className="text-gray-600 mb-8 font-medium">
              Sẵn sàng đắm chìm vào thế giới từ vựng tiếng Hàn hôm nay chưa?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold hover:opacity-90 transition shadow-lg shadow-pink-200"
              >
                Bắt đầu học
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-12 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
          <div className="flex items-center gap-4">
            <h1
              onClick={() => setCurrentView("home")}
              className="text-2xl md:text-3xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="text-pink-400" />
              Korean Flashcards
            </h1>
            {/* Hiển thị thanh Status đồng bộ ở đây */}
            <div className="hidden md:block">{renderSaveStatus()}</div>
          </div>

          <div>
            {!user ? (
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => setSaveStatus("error")}
                useOneTap
              />
            ) : (
              <div className="flex items-center gap-4">
                <img
                  src={user.picture}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <span className="hidden md:block font-bold text-gray-700">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-pink-500 hover:bg-white/50 rounded-full transition"
                  title="Đăng xuất"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================== VIEW 1: HOME (TRANG CHỦ) ===================== */}
        {currentView === "home" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Tạo bộ từ vựng mới (VD: TOPIK II)..."
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                className="flex-1 px-6 py-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700 placeholder-gray-400 shadow-sm font-medium"
                onKeyPress={(e) => e.key === "Enter" && handleCreateDeck()}
              />
              <button
                onClick={handleCreateDeck}
                className="px-6 py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-2xl hover:opacity-90 transition shadow-lg flex items-center gap-2 font-bold"
              >
                <Plus size={20} />{" "}
                <span className="hidden md:inline">Tạo bộ từ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <div
                  key={deck._id}
                  className="group relative bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setActiveDeckId(deck._id);
                    setCurrentView("study");
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-title text-gray-800">
                      {deck.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeck(deck._id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-pink-500 font-medium">
                    <BookOpen size={16} />
                    <span>{(deck.cards || []).length} thẻ từ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: STUDY (HỌC TỪ VỰNG) ===================== */}
        {currentView === "study" && activeDeck && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setCurrentView("home")}
                className="p-3 bg-white/50 hover:bg-white/80 rounded-full text-gray-600 transition shadow-sm border border-white/50"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold font-title text-gray-800">
                  {activeDeck.title}
                </h2>
                <span className="text-sm text-gray-500 font-medium">
                  Phím tắt: Space để lật, Trái/Phải để chuyển từ
                </span>
              </div>
              <button
                onClick={() => setCurrentView("edit")}
                className="px-6 py-2 bg-white/50 hover:bg-white/80 rounded-xl text-pink-600 font-bold transition shadow-sm border border-white/50"
              >
                Chỉnh sửa
              </button>
            </div>

            {activeDeck.cards && activeDeck.cards.length > 0 ? (
              <div className="flex flex-col items-center">
                <span className="mb-4 font-bold text-gray-500 bg-white/50 px-4 py-1.5 rounded-full border border-white/50 shadow-sm">
                  {cardIndex + 1} / {activeDeck.cards.length}
                </span>

                <div
                  className="w-full max-w-2xl mx-auto h-[400px] cursor-pointer"
                  style={{ perspective: "1000px" }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div
                    className="relative w-full h-full transition-transform duration-700 ease-in-out"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped
                        ? "rotateX(180deg)"
                        : "rotateX(0deg)",
                    }}
                  >
                    {/* [MÀU SẮC BẠN CUSTOM] Mặt trước: Tiếng Hàn */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-xl p-8"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <span className="font-title text-7xl font-bold text-pink-500 mb-6 drop-shadow-sm">
                        {activeDeck.cards[cardIndex].korean}
                      </span>
                      {activeDeck.cards[cardIndex].romaji && (
                        <span className="text-2xl text-gray-400 font-bold tracking-widest uppercase">
                          [{activeDeck.cards[cardIndex].romaji}]
                        </span>
                      )}
                    </div>

                    {/* [MÀU SẮC BẠN CUSTOM] Mặt sau: Tiếng Việt */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 border border-white/80 rounded-[2.5rem] shadow-xl p-8"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateX(180deg)",
                      }}
                    >
                      <span className="font-title text-4xl font-bold text-purple-700 mb-6 text-center">
                        {activeDeck.cards[cardIndex].viet}
                      </span>
                      {activeDeck.cards[cardIndex].note && (
                        <div className="text-lg text-gray-600 text-center max-w-md bg-white/50 p-4 rounded-2xl border border-white/50 font-medium">
                          {activeDeck.cards[cardIndex].note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 mt-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardIndex(Math.max(0, cardIndex - 1));
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === 0}
                    className="p-4 bg-white/50 hover:bg-white/80 rounded-full text-gray-600 disabled:opacity-30 transition shadow-sm"
                  >
                    <ArrowLeft size={28} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsLearned(activeDeck.cards[cardIndex]);
                    }}
                    title="Đánh dấu đã học"
                    className="p-4 bg-green-100/80 hover:bg-green-200/80 border border-green-200 text-green-600 rounded-full transition-all duration-300 shadow-md hover:scale-110"
                  >
                    <CheckSquare size={28} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardIndex(
                        Math.min(activeDeck.cards.length - 1, cardIndex + 1)
                      );
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === activeDeck.cards.length - 1}
                    className="p-4 bg-white/50 hover:bg-white/80 rounded-full text-gray-600 disabled:opacity-30 transition shadow-sm"
                  >
                    <ArrowRight size={28} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50">
                <p className="text-gray-500 mb-4 text-lg font-medium">
                  Chưa có thẻ từ nào trong bộ này cả 🌸
                </p>
                <button
                  onClick={() => setCurrentView("edit")}
                  className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold hover:opacity-90 transition shadow-md"
                >
                  Thêm thẻ mới ngay
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 3: EDIT (CHỈNH SỬA) ===================== */}
        {currentView === "edit" && activeDeck && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("study")}
                  className="p-3 bg-white/50 hover:bg-white/80 rounded-full text-gray-600 transition shadow-sm border border-white/50"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold font-title text-gray-800">
                  Sửa bộ: {activeDeck.title}
                </h2>
              </div>
              <div className="md:hidden">{renderSaveStatus()}</div>
            </div>

            {/* Khung Nhập thẻ từ mới */}
            <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl mb-8">
              <h3 className="text-lg font-bold text-pink-600 mb-6 flex items-center gap-2">
                <Plus size={20} /> Thêm thẻ từ mới
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Tiếng Hàn (Bắt buộc)"
                  value={newCard.korean}
                  onChange={(e) =>
                    setNewCard({ ...newCard, korean: e.target.value })
                  }
                  className="p-4 rounded-xl border border-white bg-white/60 focus:outline-none focus:ring-2 focus:ring-pink-300 font-title text-xl text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Nghĩa Tiếng Việt (Bắt buộc)"
                  value={newCard.viet}
                  onChange={(e) =>
                    setNewCard({ ...newCard, viet: e.target.value })
                  }
                  className="p-4 rounded-xl border border-white bg-white/60 focus:outline-none focus:ring-2 focus:ring-pink-300 font-medium text-lg text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Phiên âm (Tùy chọn)"
                  value={newCard.romaji}
                  onChange={(e) =>
                    setNewCard({ ...newCard, romaji: e.target.value })
                  }
                  className="p-4 rounded-xl border border-white bg-white/60 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Ghi chú / Ví dụ (Tùy chọn)"
                  value={newCard.note}
                  onChange={(e) =>
                    setNewCard({ ...newCard, note: e.target.value })
                  }
                  className="p-4 rounded-xl border border-white bg-white/60 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700 shadow-sm"
                />
              </div>
              <button
                onClick={handleAddCard}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold hover:opacity-90 transition shadow-md flex justify-center items-center gap-2"
              >
                <Save size={20} /> Lưu thẻ từ
              </button>
            </div>

            {/* Danh sách thẻ từ */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-lg">
              <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                <BookOpen size={20} /> Danh sách từ đã thêm (
                {(activeDeck.cards || []).length})
              </h3>

              {activeDeck.cards && activeDeck.cards.length > 0 ? (
                <div className="space-y-3">
                  {activeDeck.cards.map((card, index) => (
                    <div
                      key={card._id || card.id || index}
                      className="flex items-center justify-between p-4 bg-white/60 border border-white/80 rounded-2xl group hover:shadow-md transition"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <span className="font-title text-2xl text-pink-600 font-bold col-span-1">
                          {card.korean}
                        </span>
                        <span className="text-gray-400 text-sm font-bold tracking-wide col-span-1">
                          {card.romaji ? `[${card.romaji}]` : "-"}
                        </span>
                        <span className="font-medium text-gray-800 text-lg col-span-1">
                          {card.viet}
                        </span>
                        <span className="text-xs text-gray-500 truncate col-span-1">
                          {card.note || ""}
                        </span>
                      </div>

                      {/* Nút XÓA thẻ con (Đã gọi API đầy đủ) */}
                      <button
                        onClick={() => handleDeleteCard(card._id || card.id)}
                        className="rounded-xl p-3 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Xóa thẻ từ"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 font-medium">
                  Chưa có thẻ từ nào. Hãy thêm ở phía trên!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
