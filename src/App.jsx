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

  // State quản lý thông tin đăng nhập cá nhân người dùng bằng Google
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("flashcard_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // State phục vụ việc nhập liệu
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });

  // Tìm bộ từ vựng đang được chọn chỉnh sửa hoặc học từ mảng dữ liệu decks
  const activeDeck = decks.find((d) => d._id === activeDeckId);

  // --- EFFECT 1: TẢI DỮ LIỆU TỪ BACKEND ĐỒNG BỘ THEO TRẠNG THÁI LOGIN ---
  const fetchDecks = async () => {
    try {
      // Gửi kèm tham số email của user lên backend nếu đã đăng nhập. Nếu không, để rỗng
      const emailParam = user && user.email ? user.email : "";
      const response = await axios.get(`${API_URL}?email=${emailParam}`);
      setDecks(response.data);
    } catch (error) {
      console.error("Lỗi khi kết nối API lấy dữ liệu:", error);
    }
  };

  // Tải lại bộ từ vựng mỗi khi khởi chạy hoặc khi trạng thái tài khoản user thay đổi
  useEffect(() => {
    fetchDecks();
  }, [user]);

  // --- XỬ LÝ ĐĂNG NHẬP THÀNH CÔNG VÀ ĐĂNG XUẤT ---
  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      };
      setUser(userData);
      localStorage.setItem("flashcard_user", JSON.stringify(userData));
      console.log("👋 Đăng nhập thành công, chào mừng:", userData.name);
    } catch (err) {
      console.error("Lỗi giải mã token Google đăng nhập:", err);
    }
  };

  const handleLoginError = () => {
    console.log("❌ Đăng nhập bằng tài khoản Google thất bại.");
    alert("Đăng nhập thất bại, vui lòng kiểm tra lại cấu hình Client ID.");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("flashcard_user");
    setCurrentView("home");
    setActiveDeckId(null);
    console.log("🔒 Đã đăng xuất tài khoản.");
  };

  // --- THAO TÁC XỬ LÝ LOGIC BỘ TỪ VỰNG (DECKS) ---
  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    // Chặn nghiêm ngặt: Chưa đăng nhập không cho tự tạo bộ từ vựng cá nhân
    if (!user) {
      alert(
        "Vui lòng đăng nhập qua Google để khởi tạo bộ từ vựng cá nhân của riêng bạn!"
      );
      return;
    }

    try {
      const newDeckData = {
        title: newDeckTitle.trim(),
        cards: [],
        userEmail: user.email, // Gắn chính xác email người dùng gửi xuống server
      };

      const response = await axios.post(API_URL, newDeckData);
      setDecks([response.data, ...decks]);
      setNewDeckTitle("");
    } catch (error) {
      console.error("Lỗi gửi dữ liệu tạo bộ từ vựng mới:", error);
      alert(
        "Không thể khởi tạo bộ từ vựng mới. Vui lòng kiểm tra console backend."
      );
    }
  };

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation(); // Tránh kích hoạt hành vi click mở bộ bài học

    const targetDeck = decks.find((d) => d._id === deckId);
    if (!targetDeck) return;

    // Ngăn chặn nếu chưa đăng nhập hoặc bộ bài học thuộc về cộng đồng mặc định
    if (!user) {
      alert("Bạn phải đăng nhập để quản lý danh sách của bạn.");
      return;
    }

    if (targetDeck.userEmail === "default") {
      alert(
        "Đây là bộ từ vựng hệ thống mặc định chung, bạn không có quyền xóa!"
      );
      return;
    }

    if (
      confirm(`Bạn chắc chắn muốn xóa bộ từ vựng "${targetDeck.title}" không?`)
    ) {
      try {
        await axios.delete(`${API_URL}/${deckId}?email=${user.email}`);
        setDecks(decks.filter((d) => d._id !== deckId));
        if (activeDeckId === deckId) {
          setCurrentView("home");
          setActiveDeckId(null);
        }
      } catch (error) {
        console.error("Lỗi khi gửi yêu cầu xóa lên server:", error);
        alert(
          "Lỗi xóa bộ từ vựng. Bạn có quyền thao tác trên nội dung này không?"
        );
      }
    }
  };

  // --- THAO TÁC XỬ LÝ LOGIC FLASHCARD (THẺ TỪ VỰNG) BÊN TRONG DECK ---
  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCard.korean.trim() || !newCard.viet.trim()) {
      alert("Vui lòng nhập từ tiếng Hàn và nghĩa tiếng Việt cơ bản.");
      return;
    }

    if (!user) {
      alert("Bạn phải đăng nhập để thay đổi dữ liệu từ vựng.");
      return;
    }

    if (activeDeck && activeDeck.userEmail === "default") {
      alert(
        "Bộ từ vựng dùng chung này không thể thêm từ trực tiếp. Hãy đăng nhập và tạo bộ từ vựng mới của riêng bạn!"
      );
      return;
    }

    const cardWithId = {
      ...newCard,
      id: Date.now().toString(),
    };

    const updatedCards = [...activeDeck.cards, cardWithId];
    updateDeckInStateAndBackend(activeDeckId, activeDeck.title, updatedCards);

    setNewCard({ korean: "", romaji: "", viet: "", note: "" });
  };

  const handleDeleteCard = (cardId) => {
    if (!user) return;
    if (activeDeck && activeDeck.userEmail === "default") {
      alert("Không thể chỉnh sửa bộ bài chung.");
      return;
    }

    const updatedCards = activeDeck.cards.filter((c) => c.id !== cardId);
    updateDeckInStateAndBackend(activeDeckId, activeDeck.title, updatedCards);
  };

  // Đồng bộ trạng thái mảng thẻ từ vựng lên Database
  const updateDeckInStateAndBackend = async (deckId, title, cardsList) => {
    setSaveStatus("saving");

    // Cập nhật giao diện local ngay lập tức trước khi server phản hồi (Optimistic UI)
    const updatedDecks = decks.map((d) =>
      d._id === deckId ? { ...d, title, cards: cardsList } : d
    );
    setDecks(updatedDecks);

    try {
      await axios.put(`${API_URL}/${deckId}`, {
        title,
        cards: cardsList,
        userEmail: user ? user.email : "default",
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Lỗi cập nhật đồng bộ thẻ từ vựng:", error);
      setSaveStatus("error");
      alert("Không thể lưu thay đổi. Bạn không có quyền thao tác dữ liệu này.");
    }
  };

  // --- ĐIỀU HƯỚNG SỬ DỤNG CHUẨN TRẠNG THÁI PHẦN STUDY (HỌC TỪ VỰNG) ---
  const startStudy = (deckId) => {
    const targetDeck = decks.find((d) => d._id === deckId);
    if (!targetDeck || targetDeck.cards.length === 0) {
      alert(
        "Bộ từ vựng này hiện chưa có thẻ nào để ôn tập! Hãy thêm từ mới trước."
      );
      return;
    }
    setActiveDeckId(deckId);
    setCardIndex(0);
    setIsFlipped(false);
    setCurrentView("study");
  };

  const startEdit = (deckId) => {
    const targetDeck = decks.find((d) => d._id === deckId);
    if (!user) {
      alert(
        "Vui lòng đăng nhập Google để sử dụng tính năng tạo và chỉnh sửa bộ bài!"
      );
      return;
    }
    if (targetDeck && targetDeck.userEmail === "default") {
      alert(
        "Đây là bộ từ vựng mẫu dùng chung mặc định của hệ thống, không được sửa đổi."
      );
      return;
    }
    setActiveDeckId(deckId);
    setCurrentView("edit");
  };

  const nextCard = () => {
    if (cardIndex < activeDeck.cards.length - 1) {
      setCardIndex(cardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
      setIsFlipped(false);
    }
  };

  // --- GIAO DIỆN CHÍNH (HTML RENDER) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-800 antialiased font-sans pb-12">
      {/* HEADER ĐĂNG NHẬP / THÔNG TIN CÁ NHÂN */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-purple-100">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => {
            setCurrentView("home");
            setActiveDeckId(null);
          }}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-purple-200">
            K
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent">
            Korean Flashcards
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3 bg-purple-50/80 px-3 py-1.5 rounded-full border border-purple-100">
              <img
                src={user.picture}
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-purple-300 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-bold text-purple-900 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 p-1 rounded-full transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="scale-90 sm:scale-100 origin-right">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                text="signin_with"
                shape="pill"
              />
            </div>
          )}
        </div>
      </header>

      {/* KHÔNG GIAN HIỂN THỊ CHÍNH CỦA WEBPAGE */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        {/* VIEW 1: TRANG CHỦ DANH SÁCH BỘ TỪ VỰNG */}
        {currentView === "home" && (
          <div>
            {/* THƯ MỤC CHỨA KHUNG KHỞI TẠO BỘ TỪ VỰNG MỚI */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/50 mb-8">
              <h2 className="text-lg font-bold text-purple-950 mb-3 flex items-center gap-2">
                <Plus size={20} className="text-purple-600" />
                Tạo bộ từ vựng của riêng bạn
              </h2>
              <form
                onSubmit={handleCreateDeck}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  placeholder={
                    user
                      ? "Nhập tên bộ từ vựng mới... (Ví dụ: Từ vựng TOPIK 1)"
                      : "Vui lòng đăng nhập Google để tạo bộ từ vựng riêng"
                  }
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  disabled={!user}
                  className="flex-1 px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
                <button
                  type="submit"
                  disabled={!user || !newDeckTitle.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Tạo Bộ Từ
                </button>
              </form>
              {!user && (
                <p className="text-xs text-purple-600 font-medium mt-2">
                  ℹ️ Hiện tại bạn đang xem <b>Danh sách mặc định chung</b> từ
                  Database. Hãy kết nối tài khoản Google để lưu trữ danh sách
                  riêng nhé!
                </p>
              )}
            </div>

            {/* DANH SÁCH GRID HIỂN THỊ CÁC DECKS */}
            <h3 className="text-xl font-black text-purple-950 mb-4 tracking-wide">
              {user
                ? "🗂️ Thư viện bộ từ vựng của bạn & hệ thống"
                : "📚 Các bộ bài mặc định hệ thống"}
            </h3>

            {decks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium">
                Đang tải danh sách từ vựng từ server database Atlas...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    onClick={() => startStudy(deck._id)}
                    className="bg-white rounded-2xl p-6 shadow-md border border-purple-50/50 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>

                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900 text-lg line-clamp-2 pr-6 group-hover:text-purple-700 transition-colors">
                          {deck.title}
                        </h4>
                        {user && deck.userEmail !== "default" && (
                          <button
                            onClick={(e) => handleDeleteDeck(deck._id, e)}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all absolute top-4 right-4"
                            title="Xóa bộ từ này"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <span className="inline-block bg-purple-50 text-purple-700 text-xs font-black px-2.5 py-1 rounded-md mb-4">
                        {deck.cards ? deck.cards.length : 0} thẻ từ
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                      <span className="text-xs font-semibold text-gray-400">
                        {deck.userEmail === "default"
                          ? "🌍 Cộng đồng dùng chung"
                          : "🔒 Cá nhân của bạn"}
                      </span>
                      <div className="flex gap-2">
                        {user && deck.userEmail !== "default" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(deck._id);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
                          >
                            Sửa từ
                          </button>
                        )}
                        <button className="p-1.5 bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white rounded-lg transition-colors">
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STUDY MODE — CHẾ ĐỘ ÔN TẬP THẺ FLASHCARD */}
        {currentView === "study" && activeDeck && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setCurrentView("home")}
              className="mb-6 flex items-center gap-2 text-sm font-bold text-purple-800 hover:text-purple-950 transition-colors"
            >
              <ArrowLeft size={16} /> Quay về danh sách bài học
            </button>

            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {activeDeck.title}
              </h2>
              <p className="text-sm font-bold text-purple-600">
                Thẻ thứ {cardIndex + 1} trên tổng số {activeDeck.cards.length}
              </p>
            </div>

            {/* MÔ HÌNH HÓA THẺ LẬT 3D CHUYỂN ĐỘNG */}
            <div
              className="h-80 w-full cursor-pointer perspective mb-8"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`w-full h-full duration-500 transform-style relative rounded-3xl shadow-xl border border-white/80 ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* MẶT TRƯỚC (TIẾNG HÀN) */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl flex flex-col items-center justify-center p-8 select-none">
                  <span className="text-xs font-extrabold tracking-widest text-purple-400 uppercase mb-4">
                    Tiếng Hàn Quốc
                  </span>
                  <h3 className="text-4xl font-black text-purple-950 text-center leading-snug">
                    {activeDeck.cards[cardIndex]?.korean}
                  </h3>
                  {activeDeck.cards[cardIndex]?.romaji && (
                    <p className="text-lg text-gray-400 font-medium tracking-wide mt-2">
                      [{activeDeck.cards[cardIndex]?.romaji}]
                    </p>
                  )}
                  <span className="text-xs text-gray-400 mt-8 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    💡 Click chạm để lật xem nghĩa giải thích
                  </span>
                </div>

                {/* MẶT SAU (TIẾNG VIỆT) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-3xl flex flex-col items-center justify-center p-8 select-none">
                  <span className="text-xs font-extrabold tracking-widest text-purple-300 uppercase mb-4">
                    Ý nghĩa tiếng Việt
                  </span>
                  <h3 className="text-3xl font-black text-center max-w-md leading-normal text-pink-200">
                    {activeDeck.cards[cardIndex]?.viet}
                  </h3>
                  {activeDeck.cards[cardIndex]?.note && (
                    <div className="mt-4 bg-white/10 px-4 py-2 rounded-xl text-sm max-w-sm text-center text-gray-200 border border-white/5">
                      <b>Ví dụ:</b> {activeDeck.cards[cardIndex]?.note}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* THANH ĐIỀU HƯỚNG CHUYỂN THẺ FLASHCARD */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={prevCard}
                disabled={cardIndex === 0}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-purple-50 text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-3 bg-white font-bold rounded-xl shadow-md border border-gray-100 hover:bg-purple-50 text-purple-900 transition-all flex items-center gap-2 text-sm"
              >
                <RotateCcw size={16} /> Lật thẻ
              </button>
              <button
                onClick={nextCard}
                disabled={cardIndex === activeDeck.cards.length - 1}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-purple-50 text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: DECK EDITOR — CHỈNH SỬA TỪ VỰNG TRONG BỘ BÀI */}
        {currentView === "edit" && activeDeck && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <button
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-2 text-sm font-bold text-purple-800 hover:text-purple-950 transition-colors"
              >
                <ArrowLeft size={16} /> Trở về màn hình chính
              </button>

              {/* TRẠNG THÁI STATUS ĐỒNG BỘ CLOUD DATABASE */}
              {saveStatus && (
                <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-purple-100 shadow-sm animate-fade-in">
                  {saveStatus === "saving" && (
                    <span className="text-amber-600 flex items-center gap-1">
                      🔄 Đang tải lưu trữ lên cơ sở dữ liệu...
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check size={14} /> Hệ thống đã đồng bộ dữ liệu MongoDB!
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-red-600 flex items-center gap-1">
                      <X size={14} /> Lỗi đồng bộ đám mây thất bại
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-purple-50">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <span className="text-xs font-black text-purple-500 uppercase tracking-wider">
                  Trình chỉnh sửa
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-1">
                  {activeDeck.title}
                </h2>
              </div>

              {/* FORM THÊM TỪ VỰNG MỚI */}
              <form
                onSubmit={handleAddCard}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 mb-6"
              >
                <div>
                  <label className="block text-xs font-bold text-purple-940 mb-1 pl-1">
                    Từ mới (Tiếng Hàn) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 사과"
                    value={newCard.korean}
                    onChange={(e) =>
                      setNewCard({ ...newCard, korean: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-940 mb-1 pl-1">
                    Phiên âm (Romaji)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: sagwa"
                    value={newCard.romaji}
                    onChange={(e) =>
                      setNewCard({ ...newCard, romaji: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-940 mb-1 pl-1">
                    Ý nghĩa (Tiếng Việt) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quả táo"
                    value={newCard.viet}
                    onChange={(e) =>
                      setNewCard({ ...newCard, viet: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-purple-940 mb-1 pl-1">
                      Ví dụ / Ghi chú
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Ăn táo ngon"
                      value={newCard.note}
                      onChange={(e) =>
                        setNewCard({ ...newCard, note: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-colors h-[38px] flex items-center justify-center"
                    title="Thêm từ này"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </form>

              {/* DANH SÁCH THẺ TỪ ĐANG CÓ TRONG BỘ BÀI CHỌN */}
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-base">
                <BookOpen size={18} className="text-purple-600" />
                Danh sách từ vựng hiện tại (
                {activeDeck.cards ? activeDeck.cards.length : 0})
              </h3>

              {!activeDeck.cards || activeDeck.cards.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-purple-100 rounded-2xl">
                  Bộ từ vựng này trống rỗng. Hãy điền form bên trên để thêm từ
                  đầu tiên!
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {activeDeck.cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:bg-purple-50/30 hover:border-purple-200/50 transition-all shadow-2xs"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa thẻ từ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
