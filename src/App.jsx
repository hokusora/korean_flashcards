import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  RotateCcw,
  ArrowRight,
  Save,
  Check,
  X
} from "lucide-react";
import axios from "axios";

// Đường dẫn API Backend kết nối tới database MongoDB Atlas của bạn
const API_URL = "https://flashcard-backend-aa18.onrender.com/api/decks";

export default function App() {
  // --- CÁC STATE QUẢN LÝ DỮ LIỆU VÀ GIAO DIỆN ---
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home"); // "home" | "edit" | "study"
  const [activeDeckId, setActiveDeckId] = useState(null); // Lưu ID của bộ từ vựng đang chọn
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"

  // State phục vụ việc nhập liệu
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCard, setNewCard] = useState({
    korean: "",
    romaji: "",
    viet: "",
    note: "",
  });

  // State kiểm soát hiển thị Khung Welcome Modal khi mới mở web
  const [showWelcome, setShowWelcome] = useState(true);

  // Ref tham chiếu trực tiếp tới DOM của vòng tròn hiệu ứng chuột
  const cursorRef = useRef(null);

  // Lấy bộ từ vựng hiện tại dựa trên ID đang active
  const activeDeck = decks.find((d) => d._id === activeDeckId) || null;

  // --- LẮNG NGHE SỰ KIỆN DI CHUYỂN CHUỘT (BUBBLE GRADIENT) ---
  useEffect(() => {
    const moveCursor = (e) => {
      if (cursorRef.current) {
        // Di chuyển vòng tròn gradient theo tọa độ trỏ chuột một cách mượt mà nhất
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  // --- TẢI DỮ LIỆU TỪ BACKEND KHI KHỞI ĐỘNG WEB ---
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await axios.get(API_URL);
        if (Array.isArray(res.data)) {
          setDecks(res.data);
        }
      } catch (err) {
        console.error("Không thể tải danh sách bộ từ vựng từ database:", err);
      }
    };
    fetchDecks();
  }, []);

  // --- CÁC HÀM THAO TÁC CƠ SỞ DỮ LIỆU (API CALLS) ---

  // 1. Thêm bộ từ vựng mới
  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      setSaveStatus("saving");
      const res = await axios.post(API_URL, { title: newDeckTitle, cards: [] });
      setDecks([...decks, res.data]);
      setNewDeckTitle("");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // 2. Xóa một bộ từ vựng
  const handleDeleteDeck = async (id, e) => {
    e.stopPropagation(); // Ngăn sự kiện click chọn bộ từ vựng khi bấm nút xóa
    if (!window.confirm("Bạn có chắc chắn muốn xóa bộ từ vựng này không?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setDecks(decks.filter((d) => d._id !== id));
      if (activeDeckId === id) {
        setCurrentView("home");
        setActiveDeckId(null);
      }
    } catch (err) {
      console.error("Lỗi khi xóa bộ từ vựng:", err);
    }
  };

  // 3. Thêm một thẻ từ vựng mới vào bộ từ hiện tại
  const handleAddCard = async () => {
    if (!newCard.korean.trim() || !newCard.viet.trim()) {
      alert("Vui lòng nhập từ tiếng Hàn và nghĩa tiếng Việt!");
      return;
    }
    if (!activeDeck) return;

    const updatedCards = [
      ...activeDeck.cards,
      { ...newCard, id: Date.now().toString() },
    ];

    try {
      setSaveStatus("saving");
      const res = await axios.put(`${API_URL}/${activeDeckId}`, {
        title: activeDeck.title,
        cards: updatedCards,
      });
      setDecks(decks.map((d) => (d._id === activeDeckId ? res.data : d)));
      setNewCard({ korean: "", romaji: "", viet: "", note: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // 4. Xóa một thẻ từ vựng ra khỏi bộ từ hiện tại
  const handleDeleteCard = async (cardId) => {
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.filter((c) => c.id !== cardId);

    try {
      setSaveStatus("saving");
      const res = await axios.put(`${API_URL}/${activeDeckId}`, {
        title: activeDeck.title,
        cards: updatedCards,
      });
      setDecks(decks.map((d) => (d._id === activeDeckId ? res.data : d)));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  return (
    <div className="relative min-h-screen text-gray-800 overflow-x-hidden selection:bg-pink-200">
      
      {/* 1. HIỆU ỨNG CHUỘT LAN TỎA (BUBBLE GRADIENT) */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 w-[450px] h-[450px] rounded-full z-0 transition-transform duration-75 ease-out will-change-transform hidden md:block"
        style={{
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, rgba(24bc2eb, 0) 70%)",
          backgroundImage: "radial-gradient(circle, rgba(251, 194, 235, 0.5) 0%, rgba(166, 193, 238, 0) 65%)",
          filter: "blur(30px)",
        }}
      />

      {/* 2. KHUNG WELCOME MODAL KHI MỚI VÀO WEB */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md transition-all">
          <div className="glass p-8 rounded-3xl shadow-2xl max-w-md w-11/12 text-center relative animate-fade-in border border-white/60">
            <h2 className="text-3xl font-bold mb-4 text-gray-950 font-title tracking-wide">
              Annyeonghaseyo! 🌸
            </h2>
            <p className="text-gray-700 mb-8 text-base leading-relaxed">
              Chào mừng bạn đã quay trở lại không gian học tập. Hệ thống cơ sở dữ liệu đã sẵn sàng, bạn đã chuẩn bị tinh thần để chinh phục các bộ từ vựng mới ngày hôm nay chưa?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowWelcome(false)}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold hover:opacity-95 hover:scale-105 transition-all shadow-md shadow-purple-200"
              >
                Oke, học luôn!
              </button>
              <button
                onClick={() => {
                  alert("Từ chối không được đâu nhé, học tập chăm chỉ đi nào!");
                  setShowWelcome(false);
                }}
                className="px-6 py-3 bg-white/60 text-gray-700 rounded-full font-semibold hover:bg-white/90 transition-all border border-gray-200"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THÔNG BÁO TRẠNG THÁI ĐỒNG BỘ CLOUD (GÓC MÀN HÌNH) */}
      {saveStatus && (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium glass border border-white">
          {saveStatus === "saving" && (
            <>
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang lưu lên đám mây...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check size={16} className="text-green-600" />
              <span className="text-green-700">Đã lưu lên Database thành công!</span>
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

      {/* --- NỘI DUNG CHÍNH CỦA TRANG WEB --- */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        
        {/* TIÊU ĐỀ CHÍNH CỦA TRANG WEB */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 drop-shadow-sm mb-2 font-title tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-pink-700">
            K-VOCAB STUDY LAB
          </h1>
          <p className="text-gray-600 font-medium">Học từ vựng tiếng Hàn thông minh cùng hệ thống Flashcard</p>
        </header>

        {/* MÀN HÌNH 1: TRANG CHỦ DANH SÁCH BỘ TỪ (HOME VIEW) */}
        {currentView === "home" && (
          <div className="space-y-8">
            {/* Thanh công cụ thêm bộ từ mới */}
            <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center border border-white/50">
              <input
                type="text"
                placeholder="Nhập tên bộ từ vựng mới (Ví dụ: Từ vựng TOPIK I...)"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/80 text-gray-800 font-medium"
              />
              <button
                onClick={handleCreateDeck}
                className="w-full md:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} /> Tạo bộ từ
              </button>
            </div>

            {/* Grid hiển thị danh sách các Deck */}
            {decks.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-medium">
                Chưa có dữ liệu nào trong kho lưu trữ. Hãy tạo bộ từ mới ở trên!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    onClick={() => {
                      setActiveDeckId(deck._id);
                      setCurrentView("study");
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="glass p-6 rounded-2xl cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/40 flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 font-title line-clamp-2 pr-6 group-hover:text-purple-700 transition-colors">
                        {deck.title}
                      </h3>
                      <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 bg-white/40 px-3 py-1 rounded-full w-max">
                        <BookOpen size={14} /> {deck.cards?.length || 0} thẻ từ
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6 relative z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDeckId(deck._id);
                          setCurrentView("edit");
                        }}
                        className="px-4 py-2 bg-white/70 hover:bg-purple-600 hover:text-white rounded-xl text-sm font-bold transition-all border border-gray-100 shadow-sm"
                      >
                        Sửa thẻ
                      </button>
                      <button
                        onClick={(e) => handleDeleteDeck(deck._id, e)}
                        className="p-2 bg-white/70 hover:bg-red-50 text-red-600 rounded-xl transition-all border border-gray-100 shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MÀN HÌNH 2: CHẾ ĐỘ HỌC TỪ (STUDY MODE) */}
        {currentView === "study" && activeDeck && (
          <div className="max-w-2xl mx-auto space-y-6">
            <button
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2 font-bold text-purple-800 hover:text-purple-900 transition-colors bg-white/40 px-4 py-2 rounded-full w-max"
            >
              <ArrowLeft size={18} /> Quay lại trang chủ
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 font-title mb-1">{activeDeck.title}</h2>
              <p className="text-sm text-gray-500 font-bold">Thẻ {cardIndex + 1} / {activeDeck.cards.length}</p>
            </div>

            {activeDeck.cards.length === 0 ? (
              <div className="glass p-12 rounded-2xl text-center text-gray-500 font-medium border border-white">
                Bộ từ vựng này chưa có thẻ nào cả. Hãy chọn mục "Sửa thẻ" để thêm từ mới!
              </div>
            ) : (
              <>
                {/* Khối Flashcard xoay 3D */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-80 min-h-[320px] cursor-pointer perspective-1000 group"
                >
                  <div
                    className={`w-full h-full duration-500 transform-style-3d relative rounded-3xl shadow-xl border border-white/60 ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* Mặt trước: Tiếng Hàn */}
                    <div className="absolute inset-0 backface-hidden glass bg-white/50 rounded-3xl flex flex-col items-center justify-center p-8 text-center select-none">
                      <span className="text-5xl font-black text-purple-950 tracking-wide mb-2">
                        {activeDeck.cards[cardIndex]?.korean}
                      </span>
                    </div>

                    {/* Mặt sau: Nghĩa và chi tiết */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 glass bg-white/70 rounded-3xl flex flex-col items-center justify-center p-8 text-center select-none">
                      {activeDeck.cards[cardIndex]?.romaji && (
                        <p className="text-sm font-bold tracking-widest uppercase text-purple-500 mb-2">
                          [{activeDeck.cards[cardIndex]?.romaji}]
                        </p>
                      )}
                      <p className="text-3xl font-black text-gray-900 font-title mb-4">
                        {activeDeck.cards[cardIndex]?.viet}
                      </p>
                      {activeDeck.cards[cardIndex]?.note && (
                        <p className="text-sm bg-white/60 px-4 py-2 rounded-xl text-gray-600 max-w-md italic border border-white">
                          💡 {activeDeck.cards[cardIndex]?.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs font-bold text-gray-400 tracking-wider">
                  {isFlipped ? "← Click vào thẻ để lật lại mặt trước" : "Click vào thẻ để xem nghĩa →"}
                </p>

                {/* Thanh điều hướng thẻ */}
                <div className="flex justify-center items-center gap-6 mt-4">
                  <button
                    onClick={() => {
                      setCardIndex(Math.max(0, cardIndex - 1));
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === 0}
                    className="p-3.5 bg-white hover:bg-purple-50 rounded-full shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-purple-700"
                  >
                    <ArrowLeft size={22} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="p-3.5 bg-white hover:bg-purple-50 rounded-full shadow-md transition-all active:scale-95 text-gray-500"
                    title="Học lại từ đầu"
                  >
                    <RotateCcw size={22} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setCardIndex(Math.min(activeDeck.cards.length - 1, cardIndex + 1));
                      setIsFlipped(false);
                    }}
                    disabled={cardIndex === activeDeck.cards.length - 1}
                    className="p-3.5 bg-white hover:bg-purple-50 rounded-full shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-purple-700"
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* MÀN HÌNH 3: QUẢN LÝ VÀ SỬA ĐỔI THẺ (DECK EDITOR VIEW) */}
        {currentView === "edit" && activeDeck && (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2 font-bold text-purple-800 hover:text-purple-900 transition-colors bg-white/40 px-4 py-2 rounded-full w-max"
            >
              <ArrowLeft size={18} /> Lưu & Quay lại trang chủ
            </button>

            <div className="glass p-6 rounded-2xl border border-white/50 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 font-title">
                Thêm thẻ từ mới vào bộ: <span className="text-purple-700">{activeDeck.title}</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Từ tiếng Hàn *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 사과"
                    value={newCard.korean}
                    onChange={(e) => setNewCard({ ...newCard, korean: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Phiên âm Romaji</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: sagwa"
                    value={newCard.romaji}
                    onChange={(e) => setNewCard({ ...newCard, romaji: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nghĩa tiếng Việt *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quả táo"
                    value={newCard.viet}
                    onChange={(e) => setNewCard({ ...newCard, viet: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Ghi chú / Ví dụ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tôi thích ăn táo..."
                    value={newCard.note}
                    onChange={(e) => setNewCard({ ...newCard, note: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCard}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow hover:opacity-95 transition-all active:scale-[0.99] mt-2"
              >
                <Plus size={18} /> Thêm vào bộ từ vựng (Auto-save)
              </button>
            </div>

            {/* Danh sách các thẻ từ hiện tại trong Deck */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 font-title ml-1">
                Danh sách thẻ từ hiện có ({activeDeck.cards?.length || 0})
              </h3>
              
              {activeDeck.cards?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-medium glass rounded-2xl border border-white/40">
                  Chưa có thẻ từ nào trong bộ này. Hãy nhập mẫu phía trên để tích lũy từ mới!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeck.cards.map((card) => (
                    <div
                      key={card.id}
                      className="glass px-6 py-4 rounded-xl flex items-center justify-between gap-4 border border-white/40 hover:bg-white/50 transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 flex-1 items-center">
                        <span className="text-xl font-black text-purple-950">{card.korean}</span>
                        {card.romaji ? (
                          <span className="text-sm text-gray-400 font-bold tracking-wide">[{card.romaji}]</span>
                        ) : (
                          <span className="hidden md:inline text-gray-300">-</span>
                        )}
                        <span className="text-base font-bold text-gray-800 font-title">{card.viet}</span>
                      </div>
                      
                      {card.note && (
                        <div className="hidden lg:block text-xs text-gray-500 bg-white/50 px-3 py-1.5 rounded-lg max-w-xs truncate">
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