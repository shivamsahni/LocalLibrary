var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const book = require('../models/book');

exports.index = function(req, res, next){

        async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    })  
};

// Display all the books
exports.book_list = function(req, res, next){
    Book.find({}, 'title author').populate('author')
    .exec(function(err, list_books){
        if(err) return next(err);
        res.render('book_list', {title: 'Book List', book_list: list_books});
    })
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next)
{
    // res.send('NOT IMPLEMENTED: Book detail:'+req.params.id);

    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback)
        },
        book_instances: function(callback){
            BookInstance.find({'book': req.params.id})
            .exec(callback);
        },

    }, function(err, results){
        if(err) return next(err);
        if(results.book==null)
        {
            var eror = new Error('Page Not exist');
            eror.status = 404;
            return next(eror);
        }

        res.render('book_detail', {title: results.book.title, book_instances: results.book_instances, book: results.book});
    })
};

// Display Book create form on GET
exports.book_create_get = function(req, res, next){

    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    })
};

// Handle Book Create on post
exports.book_create_post = 
[
    //adding a middlewear to convert genre to a array

    function(req, res, next){

        if(!(req.body.genre instanceof Array))
        {
            if(typeof req.body.genre==='undefined')
                req.body.genre = [];
            else
            {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

    // Sanitize fields (using wildcard).
    //sanitizeBody('*').escape(),
    sanitizeBody('genre.*').escape(),
    sanitizeBody('title.*').escape(),
    sanitizeBody('author.*').escape(),
    sanitizeBody('summary.*').escape(),
    sanitizeBody('isbn.*').escape(),
    
    // process request after validation and sanitization
    function(req, res, next){

        var errors = validationResult(req);

        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        })

        if(!errors.isEmpty())
        {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.

            console.log('book author:'+book.author);
            console.log('typeof author'+typeof book.author);

            async.parallel({
                author:function(callback){
                    Author.find(callback);
                    },
                genre: function(callback){
                    Genre.find(callback);
                }
            }, function(err, results){
                if(err){return next(err);}

                // selecting all the genres selected earlier by user
                for(let i=0; i<book.genre.length; ++i)
                {
                    for(let j=0; j<results.genre.length; ++j)
                    {
                        if(book.genre[i]._id.toString()===results.genre[j]._id.toString())
                        {
                            results.genre[j].checked= 'true';
                            break;
                        }
                    }
                }                    
                res.render('book_form', {title:"Create Book", authors:results.author, genres:results.genre, book: book, errors: errors.array()});
            })
        }
        else{
            //check if same book already present in the database
            Book.findOne({title:book.title, author:book.author, summary: book.summary, isbn: book.isbn, genre: book.genre}).exec(function(err, isBook){
                if(err){return next(err);}
                if(isBook)
                {
                    // this book is already present , lets just redirect to this book details page
                    res.redirect(isBook.url);
                }
                else
                {
                    book.save(function(err){
                        if(err){ return next(err);}
                        // save successful
                        res.redirect(book.url);
                    })
                }
            }) 
        }
    }
];

// Display Book delete form on GET
exports.book_delete_get = function(req, res, next){

    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').exec(callback);
        },
        bookinstances: function(callback){
            BookInstance.find({book:req.params.id}).exec(callback)
        }
    }, function(err, results){
        if(err){return next(err);}
        if(results.book==null)
            res.redirect('/catalog/books');
        res.render('book_delete', {title:'Delete Book', book:results.book, bookinstances: results.bookinstances});
    })
};

// Handle Book delete on Post
exports.book_delete_post = function(req, res, next){

    async.parallel({
        book: function(callback){
            Book.findById(req.body.bookid).exec(callback);
        },
        bookinstances: function(callback){
            BookInstance.find({book:req.body.bookid}).exec(callback)
        }
    }, function(err, results){
        if(err){return next(err);}
        if(results.bookinstances>0)
            res.render('book_delete', {title:'Delete Book', book:results.book, bookinstances: results.bookinstances});
        else{
            Book.findByIdAndDelete(req.body.bookid).exec(function(err){
                if(err){return next(err);}
                // delete successful
                res.redirect('/catalog/books');
            })
        }
    })    
};

// Display Book update form on GET
exports.book_update_get = function(req, res, next){

    async.parallel({
        book: function(callback){Book.findById(req.params.id).populate('author').populate('genre').exec(callback)},
        authors: function(callback){Author.find().exec(callback)},
        genres: function(callback){Genre.find().exec(callback)},
    }, function(err, results){
        if(err){ return next(err);}
        // check if book is present
        if(results.book==null)
        {
            var er = new error('Book not found');
            err.status = 404;
            return next(err);
        }

        // mark checked genres before sending to view
        for(let i=0; i<results.genres.length; ++i)
        {
            for(let j=0; j<results.book.genre.length; ++j)
            {
                if(results.genres[i]._id.toString()==results.book.genre[j]._id.toString())
                {
                    results.genres[i].checked = 'true';
                }
            }
        }

        res.render('book_form', {title: 'Update Book', book:results.book, authors: results.authors, genres: results.genres })
    })
};

// Handle Book update on POST
exports.book_update_post = [
    (req, res, next)=>{

        if(!(req.body.genre instanceof Array))
        {
            if(typeof req.body.genre==='undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    
    // validate fields
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),

    // process request
    function(req, res, next){
        let errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
            _id: req.params.id//This is required, or a new ID will be assigned!
        })


        if(!errors.isEmpty())
        {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.

            console.log('book author:'+book.author);
            console.log('typeof author'+typeof book.author);

            async.parallel({
                authors: function(callback){Author.find(callback)},
                genres: function(callback){Genre.find(callback)}
            }, function(err, results){
                if(err){return next(err);}

            // mark checked genres before sending to view
            for(let i=0; i<results.genres.length; ++i)
            {
                for(let j=0; j<book.genre.length; ++j)
                {
                    if(results.genres[i]._id.toString()==book.genre[j]._id.toString())
                    {
                        results.genres[i].checked = 'true';
                    }
                }
            }  
            
            res.render('book_form', {title:'Update Book', book: book, authors: results.authors, genres: results.genres, errors: errors.array()});
            })
        }
        else{
            Book.findByIdAndUpdate(req.params.id, book, {},  function(err, theBook){
                if(err){return next(err);}
                // successfully updated book
                res.redirect(theBook.url);
            })
        }

}]