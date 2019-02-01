const express = require('express');
const router = express.Router();
const mongoos = require('mongoose');
const passport = require('passport');

// Load post model
const Post = require('../../models/Post.js');
const Profile = require('../../models/Profile.js');

// Validation
const validatePostInput = require('../../validation/post.js');

// @route  GET to api/posts/
// @desc   Get posts
// @access Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostfound: 'No posts found' }));
});

// @route  GET to api/posts/:id
// @desc   Get single post by id
// @access Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with that id' })
    );
});

// @route  POST to api/posts/
// @desc   Create post
// @access Private

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // check validation
    if (!isValid) {
      res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id,
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route Delete to api/posts/:id
// @desc Delete a post by id
// @access Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // verify that post belongs to user
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: 'User not authorized' });
          }
          post.remove().then(() => res.json({ success: 'post deleted' }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route POST to api/posts/like/:id
// @desc Like a post
// @access Private

router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          }

          //add the user id to likes array
          post.likes.unshift({ user: req.user.id });

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route POST to api/posts/unlike/:id
// @desc Unlike a post
// @access Private

router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notlike: 'you have not liked this post' });
          }

          //get remove index
          //get an array of only user ids then find the index of the current user
          const removeIndex = post.likes.map(item =>
            item.user.toString().indexOf(req.user.id)
          );
          post.likes.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route POST to api/posts/comment/:id
// @desc Add comment to post
// @access Private

router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.user.name,
          avatar: req.user.avatar,
          user: req.user.id,
        };

        post.comments.unshift(newComment);

        post.save().then(post => res.json({ post }));
      })
      .catch(err => res.send(404).json(err));
  }
);

// @route DELETE to api/posts/comment/:id/:comment_id
// @desc Remove comment from post
// @access Private

router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);
        if (post.comments[removeIndex].user.toString() !== req.user.id) {
          return res.status(401).json({
            authorization: 'you are not authorized to delete this comment',
          });
        }
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exist' });
        }

        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json({ post }));
      })
      .catch(err => res.send(404).json(err));
  }
);

module.exports = router;
