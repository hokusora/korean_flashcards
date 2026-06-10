import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

const API_URL = "https://flashcard-backend-aa18.onrender.com";

export default function App() {
  const [decks, setDecks] = useState([]);
  const [currentView, setCurrentView] = useState("home"); // "home" | "edit" | "study"
  const [activeDeckId, setActiveDeckId] = useState(null); // ← FIX BUG 5: lưu ID thay vì object
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"

  // Lấy activeDeck từ decks state (luôn mới nhất)  ← FIX BUG 5
  const activeDeck = decks.find((d) => d._id === activeDeckId) || null;

  // ==========================================
  // TẢI DỮ LIỆU KHI KHỞI ĐỘNG
  // ==========================================
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await axios.get(API_URL);
        setDecks(res.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      }
    };
    fetchDecks();
  }, []);

  // ==========================================
  // HÀM HELPER — HIỂN THỊ TRẠNG THÁI LƯU
  // ==========================================
  const showSaveStatus = (status) => {
    setSaveStatus(status);
    if (status === "saved") setTimeout(() => setSaveStatus(""), 2000);
  };

  // ==========================================
  // THÊM DECK MỚI  ← FIX BUG 3
  // ==========================================
  const addDeck = async () => {
    try {
      const res = await axios.post(API_URL, {
        title: "Bộ từ vựng mới",
        cards: [],
      });
      // Backend trả về deck object đầy đủ có _id
      setDecks([...decks, res.data]);
    } catch (err) {
      console.error("Lỗi khi tạo deck:", err);
    }
  };

  // ==========================================
  // XÓA DECK
  // ==========================================
  const deleteDeck = async (deckId) => {
    if (!window.confirm("Xóa bộ từ vựng này?")) return;
    try {
      await axios.delete(`${API_URL}/${deckId}`);
      setDecks(decks.filter((d) => d._id !== deckId));
    } catch (err) {
      console.error("Lỗi khi xóa deck:", err);
    }
  };

  // ==========================================
  // CẬP NHẬT TITLE DECK
  // ==========================================
  const updateDeckTitle = (deckId, newTitle) => {
    setDecks(
      decks.map((d) => (d._id === deckId ? { ...d, title: newTitle } : d))
    );
  };

  // ==========================================
  // THÊM CARD
  // ==========================================
  const addCard = (deckId) => {
    setDecks(
      decks.map((deck) => {
        if (deck._id !== deckId) return deck;
        return {
          ...deck,
          cards: [
            ...deck.cards,
            {
              id: Date.now().toString(),
              korean: "",
              viet: "",
              romaji: "",
              note: "",
            },
          ],
        };
      })
    );
  };

  // ==========================================
  // CẬP NHẬT NỘI DUNG CARD
  // ==========================================
  const updateCard = (deckId, cardId, field, value) => {
    setDecks(
      decks.map((deck) => {
        if (deck._id !== deckId) return deck;
        return {
          ...deck,
          cards: deck.cards.map((card) =>
            card.id === cardId ? { ...card, [field]: value } : card
          ),
        };
      })
    );
  };

  // ==========================================
  // XÓA CARD
  // ==========================================
  const removeCard = (deckId, cardId) => {
    setDecks(
      decks.map((deck) => {
        if (deck._id !== deckId) return deck;
        return { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) };
      })
    );
  };

  // ==========================================
  // LƯU DECK VỀ BACKEND (PUT)  ← FIX BUG 4
  // ==========================================
  const saveDeck = async (deckId) => {
    const deck = decks.find((d) => d._id === deckId);
    if (!deck) return;
    showSaveStatus("saving");
    try {
      await axios.put(`${API_URL}/${deckId}`, {
        title: deck.title,
        cards: deck.cards,
      });
      showSaveStatus("saved");
    } catch (err) {
      console.error("Lỗi khi lưu deck:", err);
      showSaveStatus("error");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 p-4 md:p-8">
      {/* ===== HOME VIEW ===== */}
      {currentView === "home" && (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            📚 Flashcard của bạn
          </h1>
          <button
            onClick={addDeck}
            className="mb-6 flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition"
          >
            <Plus size={18} /> Tạo bộ từ vựng mới
          </button>

          {decks.length === 0 && (
            <p className="text-slate-500">
              Chưa có bộ từ vựng nào. Tạo mới để bắt đầu!
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck) => (
              <div
                key={deck._id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-white/50 flex flex-col gap-2"
              >
                <h2 className="text-xl font-semibold text-slate-800">
                  {deck.title}
                </h2>
                <p className="text-slate-500">{deck.cards.length} thẻ</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => {
                      setActiveDeckId(deck._id);
                      setCurrentView("edit");
                    }}
                    className="text-purple-600 font-medium hover:underline"
                  >
                    ✏️ Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setActiveDeckId(deck._id);
                      setCardIndex(0);
                      setIsFlipped(false);
                      setCurrentView("study");
                    }}
                    className="text-green-600 font-medium hover:underline"
                    disabled={deck.cards.length === 0}
                  >
                    📖 Học
                  </button>
                  <button
                    onClick={() => deleteDeck(deck._id)}
                    className="text-red-400 hover:text-red-600 ml-auto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EDIT VIEW ===== */}
      {currentView === "edit" && activeDeck && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2 text-purple-800 hover:underline"
            >
              <ArrowLeft size={20} /> Quay lại
            </button>

            {/* Trạng thái lưu */}
            <span
              className={`text-sm font-medium ${
                saveStatus === "saving"
                  ? "text-yellow-600"
                  : saveStatus === "saved"
                  ? "text-green-600"
                  : saveStatus === "error"
                  ? "text-red-500"
                  : "text-transparent"
              }`}
            >
              {saveStatus === "saving"
                ? "⏳ Đang lưu..."
                : saveStatus === "saved"
                ? "✅ Đã lưu!"
                : saveStatus === "error"
                ? "❌ Lỗi lưu"
                : "·"}
            </span>
          </div>

          {/* Tên deck có thể sửa */}
          <input
            value={activeDeck.title}
            onChange={(e) => updateDeckTitle(activeDeck._id, e.target.value)}
            className="text-2xl font-bold mb-4 bg-transparent border-b-2 border-purple-300 focus:outline-none focus:border-purple-600 w-full"
          />

          <div className="space-y-3">
            {activeDeck.cards.map((card, idx) => (
              <div
                key={card.id}
                className="bg-white/70 p-4 rounded-xl flex items-center gap-3"
              >
                <span className="text-slate-400 text-sm w-6">{idx + 1}</span>
                <input
                  value={card.korean}
                  onChange={(e) =>
                    updateCard(
                      activeDeck._id,
                      card.id,
                      "korean",
                      e.target.value
                    )
                  }
                  placeholder="Tiếng Hàn"
                  className="bg-transparent outline-none flex-1 border-b border-slate-200 focus:border-purple-400"
                />
                <input
                  value={card.viet}
                  onChange={(e) =>
                    updateCard(activeDeck._id, card.id, "viet", e.target.value)
                  }
                  placeholder="Nghĩa tiếng Việt"
                  className="bg-transparent outline-none flex-1 border-b border-slate-200 focus:border-purple-400"
                />
                <input
                  value={card.romaji}
                  onChange={(e) =>
                    updateCard(
                      activeDeck._id,
                      card.id,
                      "romaji",
                      e.target.value
                    )
                  }
                  placeholder="Phiên âm"
                  className="bg-transparent outline-none flex-1 border-b border-slate-200 focus:border-purple-400"
                />
                <button
                  onClick={() => removeCard(activeDeck._id, card.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => addCard(activeDeck._id)}
              className="flex-1 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
            >
              + Thêm thẻ mới
            </button>
            <button
              onClick={() => saveDeck(activeDeck._id)}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
            >
              💾 Lưu về Database
            </button>
          </div>
        </div>
      )}

      {/* ===== STUDY VIEW ===== */}
      {currentView === "study" && activeDeck && (
        <div className="max-w-xl mx-auto text-center">
          <button
            onClick={() => setCurrentView("home")}
            className="flex items-center gap-2 text-purple-800 hover:underline mb-6"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>

          <h2 className="text-xl font-bold mb-2">{activeDeck.title}</h2>
          <p className="text-slate-500 mb-6">
            {cardIndex + 1} / {activeDeck.cards.length}
          </p>

          {activeDeck.cards.length > 0 && (
            <>
              {/* Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-white rounded-3xl shadow-xl p-12 cursor-pointer min-h-[200px] flex flex-col items-center justify-center gap-4 select-none"
              >
                {!isFlipped ? (
                  <p className="text-4xl font-bold text-purple-800">
                    {activeDeck.cards[cardIndex].korean}
                  </p>
                ) : (
                  <>
                    <p className="text-3xl font-semibold text-slate-800">
                      {activeDeck.cards[cardIndex].viet}
                    </p>
                    {activeDeck.cards[cardIndex].romaji && (
                      <p className="text-slate-500">
                        {activeDeck.cards[cardIndex].romaji}
                      </p>
                    )}
                  </>
                )}
                <p className="text-xs text-slate-400 mt-4">
                  {isFlipped ? "← Click để lật lại" : "Click để xem nghĩa →"}
                </p>
              </div>

              {/* Điều hướng */}
              <div className="flex justify-center gap-6 mt-6">
                <button
                  onClick={() => {
                    setCardIndex(Math.max(0, cardIndex - 1));
                    setIsFlipped(false);
                  }}
                  disabled={cardIndex === 0}
                  className="p-3 bg-white rounded-full shadow disabled:opacity-30"
                >
                  <ArrowLeft size={22} />
                </button>
                <button
                  onClick={() => {
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="p-3 bg-white rounded-full shadow"
                >
                  <RotateCcw size={22} />
                </button>
                <button
                  onClick={() => {
                    setCardIndex(
                      Math.min(activeDeck.cards.length - 1, cardIndex + 1)
                    );
                    setIsFlipped(false);
                  }}
                  disabled={cardIndex === activeDeck.cards.length - 1}
                  className="p-3 bg-white rounded-full shadow disabled:opacity-30"
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
