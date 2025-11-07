const express = require('express');
const { authenticateJwt } = require('../middleware/auth');
const {
  createPost,
  listPostsCursor,
  countLikes,
  hasUserLiked,
  likePost,
  unlikePost,
  getUserById,
} = require('../data/store');

const router = express.Router();

router.use(authenticateJwt);

router.post('/', (req, res) => {
  const { title, content } = req.body || {};
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }
  const post = createPost({ authorId: req.user.id, title: title.trim(), content: content.trim() });
  return res.status(201).json(serializePost(post, req.user.id));
});

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const cursor = req.query.cursor || null;

  const { items, nextCursor } = listPostsCursor({ limit, cursor });
  const result = items.map((p) => serializePost(p, req.user.id));
  return res.json({ items: result, nextCursor });
});

router.post('/:postId/like', (req, res) => {
  const { postId } = req.params;
  likePost({ userId: req.user.id, postId });
  return res.status(204).end();
});

router.delete('/:postId/like', (req, res) => {
  const { postId } = req.params;
  unlikePost({ userId: req.user.id, postId });
  return res.status(204).end();
});

function serializePost(post, viewerUserId) {
  const author = getUserById(post.authorId);
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    author: author ? { id: author.id, username: author.username } : null,
    likesCount: countLikes(post.id),
    likedByViewer: hasUserLiked({ userId: viewerUserId, postId: post.id }),
  };
}

module.exports = router;


