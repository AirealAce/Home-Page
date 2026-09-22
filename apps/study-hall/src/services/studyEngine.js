export const RATINGS = ["again", "hard", "good", "easy"];
export const DEFAULT_KEYS = {
  again: "1",
  hard: "2",
  good: "3",
  easy: "4",
  replay: "r",
};
export function startSession(deck) {
  const stats = Object.fromEntries(
    deck.cards.map((c) => [
      c.id,
      {
        presented: 0,
        attempts: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
        attemptsToSuccess: null,
        finalRating: null,
      },
    ]),
  );
  if (deck.cards[0]) stats[deck.cards[0].id].presented = 1;
  return {
    id: crypto.randomUUID(),
    deckId: deck.id,
    deckName: deck.name,
    startedAt: Date.now(),
    queue: deck.cards.map((c) => c.id),
    stats,
    revealed: false,
    revision: 0,
    undoStack: [],
  };
}
export function rateCard(session, rating) {
  if (!RATINGS.includes(rating) || !session.revealed || !session.queue.length)
    return session;
  const [id, ...queue] = session.queue;
  const stats = structuredClone(session.stats),
    current = stats[id];
  current.attempts++;
  current[rating]++;
  current.finalRating = rating;
  if (rating === "again") queue.push(id);
  else current.attemptsToSuccess = current.attempts;
  const undoEntry = {
    cardId: id,
    rating,
    cardStats: session.stats[id],
    nextCardId: queue[0] || null,
    nextCardStats: queue.length ? session.stats[queue[0]] : null,
  };
  if (queue.length) stats[queue[0]].presented++;
  return {
    ...session,
    queue,
    stats,
    revealed: false,
    revision: session.revision + 1,
    undoStack: [...(session.undoStack || []), undoEntry],
    ...(!queue.length ? { completedAt: Date.now() } : {}),
  };
}
export function undoRating(session) {
  if (!session?.undoStack?.length) return session;
  const undoStack = session.undoStack.slice(),
    previous = undoStack.pop();
  const queue = session.queue.slice();
  if (previous.rating === "again") queue.pop();
  queue.unshift(previous.cardId);
  const stats = {
    ...session.stats,
    [previous.cardId]: { ...previous.cardStats },
  };
  if (previous.nextCardId)
    stats[previous.nextCardId] = { ...previous.nextCardStats };
  const { completedAt, ...rest } = session;
  return {
    ...rest,
    queue,
    stats,
    undoStack,
    revealed: true,
    revision: session.revision + 1,
  };
}
export function summarize(session) {
  const rows = Object.values(session.stats),
    total = rows.length;
  const first = rows.filter((r) => r.attemptsToSuccess === 1).length;
  const attempts = rows.reduce((n, r) => n + r.attempts, 0);
  return {
    total,
    first,
    attempts,
    completed: rows.filter((r) => r.attemptsToSuccess !== null).length,
    score: total ? Math.round((first / total) * 100) : 0,
    average: total ? (attempts / total).toFixed(2) : "0.00",
    ...Object.fromEntries(
      RATINGS.map((k) => [k, rows.reduce((n, r) => n + r[k], 0)]),
    ),
  };
}
