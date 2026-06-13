import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { createNotification } from '../services/NotificationService';

const CATEGORIES = [
  { name: 'School', icon: '📚', color: '#667eea' },
  { name: 'Medical', icon: '🏥', color: '#4facfe' },
  { name: 'Sports', icon: '⚽', color: '#f093fb' },
  { name: 'Activities', icon: '🎨', color: '#43e97b' },
  { name: 'Food', icon: '🍕', color: '#fa709a' },
  { name: 'Clothing', icon: '👕', color: '#ffa500' },
  { name: 'Other', icon: '📌', color: '#a8edea' },
];

function ExpenseTracker({ familyId, linkedParentId, currentUserName }) {
  const [expenses, setExpenses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!familyId) return;

    const q = query(
      collection(db, 'expenses'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(data);
    });

    return () => unsubscribe();
  }, [familyId]);

  // Calculate balance: positive = linkedParent owes me, negative = I owe linkedParent
  const getBalance = () => {
    if (!linkedParentId) return null;
    let balance = 0;
    expenses.forEach(exp => {
      if (exp.settled) return;
      const half = exp.amount / 2;
      if (exp.paidBy === user.uid) {
        balance += half; // they owe me half
      } else {
        balance -= half; // I owe them half
      }
    });
    return balance;
  };

  const balance = getBalance();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) { setError('Please select a category'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cat = CATEGORIES.find(c => c.name === category);
      await addDoc(collection(db, 'expenses'), {
        familyId,
        description,
        amount: parseFloat(parseFloat(amount).toFixed(2)),
        category: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        paidBy: user.uid,
        paidByName: currentUserName || 'A parent',
        date,
        settled: false,
        createdAt: new Date(),
      });

      if (linkedParentId) {
        await createNotification(
          linkedParentId,
          'New Expense Added',
          `${currentUserName || 'Your co-parent'} paid $${parseFloat(amount).toFixed(2)} for ${description || category} — you owe $${(parseFloat(amount) / 2).toFixed(2)}`,
          'expense_added',
          { amount: parseFloat(amount), description, category }
        );
      }

      setDescription('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowAdd(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const settleAll = async () => {
    const unsettled = expenses.filter(e => !e.settled);
    await Promise.all(
      unsettled.map(e => updateDoc(doc(db, 'expenses', e.id), { settled: true }))
    );
    if (linkedParentId && unsettled.length > 0) {
      await createNotification(
        linkedParentId,
        'Expenses Settled',
        `${currentUserName || 'Your co-parent'} marked all expenses as settled`,
        'expense_added',
        {}
      );
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await deleteDoc(doc(db, 'expenses', id));
  };

  const unsettledExpenses = expenses.filter(e => !e.settled);
  const settledExpenses = expenses.filter(e => e.settled);
  const displayExpenses = showAll ? unsettledExpenses : unsettledExpenses.slice(0, 5);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>💰 Shared Expenses</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          + Add Expense
        </button>
      </div>

      {/* Balance Summary */}
      {balance !== null && (
        <div style={{
          background: balance > 0 ? 'rgba(52, 168, 83, 0.1)' : balance < 0 ? 'rgba(255, 107, 157, 0.1)' : 'rgba(102, 126, 234, 0.1)',
          border: `2px solid ${balance > 0 ? '#34a853' : balance < 0 ? '#ff6b9d' : '#667eea'}`,
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {balance === 0 ? (
            <p style={{ margin: 0, fontWeight: 'bold', color: '#667eea', fontSize: '16px' }}>
              ✅ All settled up!
            </p>
          ) : balance > 0 ? (
            <>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>Co-parent owes you</p>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#34a853', fontSize: '24px' }}>
                ${balance.toFixed(2)}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>You owe co-parent</p>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#ff6b9d', fontSize: '24px' }}>
                ${Math.abs(balance).toFixed(2)}
              </p>
            </>
          )}
          {unsettledExpenses.length > 0 && (
            <button
              onClick={settleAll}
              style={{
                marginTop: '10px',
                padding: '6px 14px',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#666'
              }}
            >
              Mark All Settled
            </button>
          )}
        </div>
      )}

      {/* Add Expense Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} style={{
          background: '#f8f9fa',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>New Expense</h4>

          {error && (
            <p style={{ color: '#ff4444', fontSize: '14px', margin: '0 0 12px 0' }}>{error}</p>
          )}

          {/* Category */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#555' }}>
              Category *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: `2px solid ${cat.color}`,
                    background: category === cat.name ? cat.color : 'white',
                    color: category === cat.name ? 'white' : cat.color,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#555' }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Soccer cleats, dentist visit..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Amount + Date */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#555' }}>
                Amount ($) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#555' }}>
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setError(''); }}
              style={{
                padding: '10px 16px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Expense List */}
      {unsettledExpenses.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px 0', margin: 0 }}>
          No unsettled expenses. Add one above!
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayExpenses.map(exp => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: `1px solid ${exp.categoryColor}30`
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: `${exp.categoryColor}20`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  {exp.categoryIcon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '2px' }}>
                    {exp.description || exp.category}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {formatDate(exp.date)} · Paid by {exp.paidBy === user.uid ? 'you' : exp.paidByName}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>
                    ${exp.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: exp.paidBy === user.uid ? '#34a853' : '#ff6b9d' }}>
                    {exp.paidBy === user.uid ? `they owe $${(exp.amount / 2).toFixed(2)}` : `you owe $${(exp.amount / 2).toFixed(2)}`}
                  </div>
                </div>
                {exp.paidBy === user.uid && (
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    title="Delete"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ccc',
                      fontSize: '16px',
                      padding: '4px',
                      flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {unsettledExpenses.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#667eea',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {showAll ? 'Show less' : `Show all ${unsettledExpenses.length} expenses`}
            </button>
          )}
        </>
      )}

      {/* Settled expenses count */}
      {settledExpenses.length > 0 && (
        <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          {settledExpenses.length} settled expense{settledExpenses.length !== 1 ? 's' : ''} hidden
        </p>
      )}
    </div>
  );
}

export default ExpenseTracker;
