import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';

// --- MOCK DATA BAN ĐẦU (Nếu LocalStorage trống) ---
const defaultDecks = [
  {
    id: '1',
    title: 'TOPIK I - Từ vựng mỗi ngày',
    cards: [
      { id: 'c1', korean: '안녕하세요', romaji: 'annyeonghaseyo', viet: 'Xin chào', note: 'Dùng trong mọi tình huống giao tiếp' },
      { id: 'c2', korean: '감사합니다', romaji: 'gamsahamnida', viet: 'Cảm ơn', note: 'Dạng kính ngữ trang trọng' },
      { id: 'c3', korean: '음악', romaji: 'eum-ak', viet: 'Âm nhạc', note: 'Thường đi với 하다 (chơi nhạc) hoặc 듣다 (nghe nhạc)' },
    ]
  }
];

export default function App() {
  const [decks, setDecks] = useState(() => {
    const saved = localStorage.getItem('korean_decks');
    return saved ? JSON.parse(saved) : defaultDecks;
  });
  const [currentView, setCurrentView] = useState('home'); // 'home', 'study', 'edit'
  const [activeDeck, setActiveDeck] = useState(null);

  // Lưu vào LocalStorage mỗi khi decks thay đổi
  useEffect(() => {
    localStorage.setItem('korean_decks', JSON.stringify(decks));
  }, [decks]);

  const createDeck = () => {
    const newDeck = { id: Date.now().toString(), title: 'Deck mới', cards: [] };
    setDecks([...decks, newDeck]);
    setActiveDeck(newDeck);
    setCurrentView('edit');
  };

  const deleteDeck = (id) => {
    setDecks(decks.filter(d => d.id !== id));
  };

  const updateActiveDeck = (updatedDeck) => {
    setDecks(decks.map(d => d.id === updatedDeck.id ? updatedDeck : d));
    setActiveDeck(updatedDeck);
  };

  return (
    <div className="min-h-screen text-slate-800 p-6 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 flex justify-between items-center glass rounded-2xl p-4">
        <h1 className="text-2xl font-bold text-indigo-900 drop-shadow-sm cursor-pointer" onClick={() => setCurrentView('home')}>
          🌸 K-Voca Chill
        </h1>
        {currentView === 'home' && (
          <button onClick={createDeck} className="bg-white/70 hover:bg-white text-indigo-700 px-4 py-2 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2">
            <Plus size={18} /> Tạo Deck mới
          </button>
        )}
      </header>

      {/* Routing Views */}
      <main className="w-full max-w-4xl">
        {currentView === 'home' && (
          <DeckList decks={decks} onStudy={(d) => { setActiveDeck(d); setCurrentView('study'); }} onEdit={(d) => { setActiveDeck(d); setCurrentView('edit'); }} onDelete={deleteDeck} />
        )}
        {currentView === 'study' && (
          <StudyMode deck={activeDeck} onBack={() => setCurrentView('home')} />
        )}
        {currentView === 'edit' && (
          <DeckEditor deck={activeDeck} updateDeck={updateActiveDeck} onBack={() => setCurrentView('home')} />
        )}
      </main>
    </div>
  );
}

// --- COMPONENT: DANH SÁCH DECK ---
function DeckList({ decks, onStudy, onEdit, onDelete }) {
  if (decks.length === 0) return <div className="text-center text-indigo-900 mt-20">Chưa có deck nào. Hãy tạo một deck mới nhé!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map(deck => (
        <div key={deck.id} className="glass rounded-3xl p-6 transition-transform hover:-translate-y-2 duration-300">
          <h2 className="text-xl font-bold mb-2 text-indigo-950">{deck.title}</h2>
          <p className="text-sm text-indigo-800 mb-6">{deck.cards.length} thẻ từ vựng</p>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button onClick={() => onStudy(deck)} className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors shadow-md" title="Học ngay">
                <BookOpen size={20} />
              </button>
              <button onClick={() => onEdit(deck)} className="bg-white/60 hover:bg-white text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors" title="Chỉnh sửa">
                Edit
              </button>
            </div>
            <button onClick={() => onDelete(deck.id)} className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- COMPONENT: CHẾ ĐỘ HỌC (STUDY MODE) ---
function StudyMode({ deck, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = deck.cards;
  const currentCard = cards[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150); // Đợi lật xong rồi mới đổi thẻ
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Bắt sự kiện bàn phím (Space, Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center glass p-10 rounded-2xl">
        <p className="mb-4">Deck này chưa có thẻ nào.</p>
        <button onClick={onBack} className="bg-indigo-500 text-white px-4 py-2 rounded-lg">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-900 hover:opacity-70"><ArrowLeft size={20} /> Trở về</button>
        <span className="font-semibold text-indigo-900 bg-white/40 px-4 py-1 rounded-full">{currentIndex + 1} / {cards.length}</span>
      </div>

      {/* FLASHCARD 3D */}
      <div className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer" onClick={handleFlip}>
        <div className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* MẶT TRƯỚC (HÀN QUỐC) */}
          <div className="absolute w-full h-full glass rounded-3xl flex flex-col justify-center items-center p-8 backface-hidden shadow-xl border-t-2 border-white/80">
            <h2 className="text-5xl font-bold text-indigo-950 mb-4 tracking-wider">{currentCard.korean}</h2>
            <p className="text-lg text-indigo-700/70 font-mono">[{currentCard.romaji}]</p>
            <p className="absolute bottom-6 text-sm text-slate-500">Bấm Space để lật</p>
          </div>

          {/* MẶT SAU (TIẾNG VIỆT) */}
          <div className="absolute w-full h-full glass rounded-3xl flex flex-col justify-center items-center p-8 backface-hidden rotate-y-180 shadow-xl bg-white/60">
            <h3 className="text-3xl font-bold text-pink-600 mb-4">{currentCard.viet}</h3>
            {currentCard.note && (
              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-pink-100 text-center w-full max-w-md">
                <p className="text-sm text-slate-700 italic">💡 {currentCard.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Điều khiển */}
      <div className="flex gap-6 mt-10 items-center">
        <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full glass hover:bg-white/80 disabled:opacity-30 transition-all text-indigo-900">
          <ArrowLeft size={24} />
        </button>
        <button onClick={handleFlip} className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg">
          <RotateCcw size={24} />
        </button>
        <button onClick={handleNext} disabled={currentIndex === cards.length - 1} className="p-3 rounded-full glass hover:bg-white/80 disabled:opacity-30 transition-all text-indigo-900">
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}

// --- COMPONENT: CHỈNH SỬA DECK ---
function DeckEditor({ deck, updateDeck, onBack }) {
  const handleTitleChange = (e) => {
    updateDeck({ ...deck, title: e.target.value });
  };

  const addCard = () => {
    const newCard = { id: Date.now().toString(), korean: '', romaji: '', viet: '', note: '' };
    updateDeck({ ...deck, cards: [...deck.cards, newCard] });
  };

  const updateCard = (cardId, field, value) => {
    const newCards = deck.cards.map(c => c.id === cardId ? { ...c, [field]: value } : c);
    updateDeck({ ...deck, cards: newCards });
  };

  const removeCard = (cardId) => {
    updateDeck({ ...deck, cards: deck.cards.filter(c => c.id !== cardId) });
  };

  return (
    <div className="w-full">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-900 mb-6 hover:opacity-70"><ArrowLeft size={20} /> Trở về</button>
      
      <div className="glass rounded-2xl p-6 mb-8 flex flex-col gap-2">
        <label className="text-sm font-semibold text-indigo-800">Tên Deck</label>
        <input 
          type="text" value={deck.title} onChange={handleTitleChange}
          className="text-2xl font-bold bg-transparent border-b-2 border-indigo-200 focus:border-indigo-500 outline-none p-2 text-indigo-950 placeholder-indigo-300"
          placeholder="Nhập tên chủ đề (VD: TOPIK I)..."
        />
      </div>

      <div className="space-y-4">
        {deck.cards.map((card, index) => (
          <div key={card.id} className="glass rounded-xl p-5 flex gap-4 relative group">
            <span className="absolute -left-3 -top-3 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">{index + 1}</span>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Từ tiếng Hàn (VD: 사랑)" value={card.korean} onChange={(e) => updateCard(card.id, 'korean', e.target.value)} className="bg-white/50 p-3 rounded-lg outline-none focus:bg-white transition-colors" />
              <input type="text" placeholder="Nghĩa tiếng Việt (VD: Tình yêu)" value={card.viet} onChange={(e) => updateCard(card.id, 'viet', e.target.value)} className="bg-white/50 p-3 rounded-lg outline-none focus:bg-white transition-colors" />
              <input type="text" placeholder="Phiên âm (Romaji/Cách đọc)" value={card.romaji} onChange={(e) => updateCard(card.id, 'romaji', e.target.value)} className="bg-white/50 p-3 rounded-lg outline-none focus:bg-white transition-colors" />
              <input type="text" placeholder="Ghi chú / Ví dụ (Tùy chọn)" value={card.note} onChange={(e) => updateCard(card.id, 'note', e.target.value)} className="bg-white/50 p-3 rounded-lg outline-none focus:bg-white transition-colors" />
            </div>
            <button onClick={() => removeCard(card.id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
              <Trash2 size={24} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addCard} className="w-full mt-6 py-4 glass border-dashed border-2 border-indigo-300 rounded-xl text-indigo-700 font-semibold flex items-center justify-center gap-2 hover:bg-white/50 transition-colors">
        <Plus size={20} /> Thêm thẻ mới
      </button>
    </div>
  );
}