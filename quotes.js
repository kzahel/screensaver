const QUOTES = [
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Innovation distinguishes between a leader and a follower. — Steve Jobs",
  "Stay hungry, stay foolish. — Steve Jobs",
  "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
  "The best way to predict the future is to invent it. — Alan Kay",
  "Code is like humor. When you have to explain it, it's bad. — Cory House",
  "First, solve the problem. Then, write the code. — John Johnson",
  "Make it work, make it right, make it fast. — Kent Beck",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
  "The most dangerous phrase in the language is 'We've always done it this way.' — Grace Hopper",
  "Programs must be written for people to read, and only incidentally for machines to execute. — Harold Abelson",
  "The computer was born to solve problems that did not exist before. — Bill Gates",
  "Measuring programming progress by lines of code is like measuring aircraft building progress by weight. — Bill Gates",
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code. — Dan Salomon",
  "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away. — Antoine de Saint-Exupéry",
  "In theory, theory and practice are the same. In practice, they're not. — Yogi Berra",
  "The function of good software is to make the complex appear to be simple. — Grady Booch",
  "Walking on water and developing software from a specification are easy if both are frozen. — Edward V. Berard",
  "Before software can be reusable it first has to be usable. — Ralph Johnson"
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

if (typeof window !== 'undefined') {
  window.ScreensaverQuotes = { QUOTES, getRandomQuote };
}
