var express = require('express');
var router = express.Router();

// require controller modules
var bookController = require('../controllers/bookController');
var bookinstanceController = require('../controllers/bookinstanceController');
var authorController = require('../controllers/authorController');
var genreController = require('../controllers/genreController');

// Book router

// GET catalog homepage
router.get('/', bookController.index);

// GET request for creating a book. Note this must come before routes that display book (using a id from url) 
router.get('/book/create', bookController.book_create_get);

// POST request for creating Book
router.post('/book/create', bookController.book_create_post);

// GET request to delete a book
router.get('/book/:id/delete', bookController.book_delete_get);

// POST request to delete a book.
router.post('/book/:id/delete', bookController.book_delete_post);

// GET request to update a book
router.get('/book/:id/update', bookController.book_update_get);

// POST request to update a book
router.post('/book/:id/update', bookController.book_update_post);

// GET request for one book
router.get('/book/:id', bookController.book_detail);

// GET request for list of all Book items
router.get('/books', bookController.book_list);


// Auther router

// GET request for creating author . Note , this must come before router for id(i.e display author)
router.get('/author/create', authorController.author_create_get);

// POST request for creating author
router.post('/author/create', authorController.author_create_post);

// GET request to delete author
router.get('/author/:id/delete', authorController.author_delete_get);

// POST request to delete author
router.post('/author/:id/delete', authorController.author_delete_post);

// GET request to update author
router.get('/author/:id/update', authorController.author_update_get);

// POST request to update author
router.post('/author/:id/update', authorController.author_update_post);

// GET request for one Author
router.get('/author/:id', authorController.author_detail);

// GET request for list of all authors
router.get('/authors', authorController.author_list);


// Genre router

// GET request for creating a GENRE . NOTE this must come before route that diplays GENRE (using a id)
router.get('/genre/create', genreController.genre_create_get);

// POST request for creating a genre
router.post('/genre/create', genreController.genre_create_post);

// GET request to delete a genre
router.get('/genre/:id/delete', genreController.genre_delete_get);

// POST request to delete a genre
router.post('/genre/:id/delete', genreController.genre_delelte_post)

// GET request to update a genre
router.get('/genre/:id/update', genreController.genre_update_get);

// POST request to update a genre
router.post('/genre/:id/update', genreController.genre_update_post);

// GET request for one GENRE
router.get('/genre/:id', genreController.genre_detail);

// GET request for list of all genre
router.get('/genres', genreController.genre_list);


// BookInstance routes

// GET request for creating a BookInstance. NOTE this must come before route that displays bookinstance (uses id)
router.get('/bookinstance/create', bookinstanceController.bookinstance_create_get);

// POST request for creating a bookinstance
router.post('/bookinstance/create', bookinstanceController.bookinstance_create_post);

// GET request to delete a bookinstance
router.get('/bookinstance/:id/delete', bookinstanceController.bookinstance_delete_get);

// POST request to delte a bookinstance
router.post('/bookinstance/:id/delete', bookinstanceController.bookinstance_delete_post);

// GET request to update a bookinstance
router.get('/bookinstance/:id/update', bookinstanceController.bookinstance_update_get);

// POST request to update a bookinstance
router.post('/bookinstance/:id/update', bookinstanceController.bookinstance_update_post);

// GET request for one BookInstance
router.get('/bookinstance/:id', bookinstanceController.bookinstance_detail);

// GET request for list of all BookInstance
router.get('/bookinstances', bookinstanceController.bookinstance_list);

module.exports = router;










