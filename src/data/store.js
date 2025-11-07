const crypto = require('crypto');

function generateId() {
  return crypto.randomUUID();
}

const users = [];
const posts = [];
const likes = new Map();

function findUserByUsername(username) {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

function getUserById(userId) {
  return users.find((u) => u.id === userId);
}

function createUser({ username, passwordHash }) {
  const user = {
    id: generateId(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function createPost({ authorId, title, content }) {
  const post = {
    id: generateId(),
    authorId,
    title,
    content,
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  return post;
}

function likePost({ userId, postId }) {
  const key = `${userId}:${postId}`;
  likes.set(key, true);
}

function unlikePost({ userId, postId }) {
  const key = `${userId}:${postId}`;
  likes.delete(key);
}

function hasUserLiked({ userId, postId }) {
  const key = `${userId}:${postId}`;
  return likes.has(key);
}

function countLikes(postId) {
  let count = 0;
  for (const key of likes.keys()) {
    if (key.endsWith(`:${postId}`)) count += 1;
  }
  return count;
}

function listPostsCursor({ limit = 10, cursor }) {
  const sorted = [...posts].sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1; // desc by id
    return a.createdAt < b.createdAt ? 1 : -1; // desc by date
  });

  let startIndex = 0;
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      const { createdAt: cAt, id: cId } = decoded;
      startIndex = sorted.findIndex(
        (p) => p.createdAt === cAt && p.id === cId
      );
      if (startIndex !== -1) startIndex += 1;
      else startIndex = 0;
    } catch (_) {
      startIndex = 0;
    }
  }

  const items = sorted.slice(startIndex, startIndex + limit);
  const last = items[items.length - 1];
  const nextCursor = last
    ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString('base64')
    : null;

  return { items, nextCursor };
}

module.exports = {
  users,
  posts,
  likes,
  findUserByUsername,
  getUserById,
  createUser,
  createPost,
  likePost,
  unlikePost,
  hasUserLiked,
  countLikes,
  listPostsCursor,
};



