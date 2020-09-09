var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
var validator = require('express-validator');
const { book_delete_get } = require('./bookController');
const { checkout } = require('../routes/catalog');


// Display list of all Genre
exports.genre_list = function(req, res){
    Genre.find({}, function(err, genres){
        if(err) return next(err);
        res.render('genre_list', {title: 'Genre List', genre_list: genres});
    })
}

// Display detail page for a specific Genre
exports.genre_detail = function(req, res){
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });
}

// Display genre create form on GET
exports.genre_create_get = function(req, res){
    res.render('genre_form', {title: 'Create Genre'});
}

// Handle genre create on POST
exports.genre_create_post = [

    // Validate that the name field is not empty.
    validator.body('name', 'Genre name required').trim().isLength({min:1}),
    // Sanitize (escape) the name field.
    validator.sanitizeBody('name').escape(),
    // Process request after validation and sanitization.
    (req, res, next)=>{
        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre(
            { name: req.body.name }
        );        

        if(!errors.isEmpty())
        {
            res.render('genre_form', {title:'Create Genre', genre: genre, errors:errors.array()});
            return; 
        }
        else{
            // data from form is valid
            // check if genre with same name already exists
            Genre.findOne({ 'name': req.body.name })
            .exec( function(err, found_genre) {
               if (err) { return next(err); }
    
               if (found_genre) {
                 // Genre exists, redirect to its detail page.
                 res.redirect(found_genre.url);
               }
               else {
    
                 genre.save(function (err) {
                   if (err) { return next(err); }
                   // Genre saved. Redirect to genre detail page.
                   res.redirect(genre.url);
                 });
    
               }
            });            
        }


    }
]

// Display genre delete form on GET
exports.genre_delete_get = function(req, res){

    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback);
        },
        books: function(callback){
            Book.find({genre:req.params.id}).exec(callback);
        }
    },function(err, results){
        if(err){ return next(err);}
        if(results.genre==null)
            res.redirect('/catalog/genres');
        res.render('genre_delete', {title: 'Delete Genre', genre:results.genre, books:results.books});
    })
}

// Handle genre delete on POST
exports.genre_delelte_post = function(req, res){
    async.parallel({
        genre: function(callback){
            Genre.findById(req.body.genreid).exec(callback);
        },
        books: function(callback){
            Book.find({genre:req.body.genreid}).exec(callback);
        }
    },function(err, results){
        if(err){ return next(err);}
        if(results.books>0)
            res.render('genre_delete', {title: 'Delete Genre', genre:results.genre, books:results.books});
        else{
            Genre.findByIdAndDelete(req.body.genreid).exec(function(err){
                if(err){ return next(err);}
                res.redirect('/catalog/genres');
            })
        }
    })

}

// Display genre update form on GET
exports.genre_update_get = function(req, res, next){
    Genre.findById(req.params.id,function(err, genre){
        if(err){return next(err);}
        res.render('genre_form', {title: 'Update Genre', genre:genre});
    })

}

// Handle genre update on POST
exports.genre_update_post = [

    // Validate that the name field is not empty.
    validator.body('name', 'Genre name required').trim().isLength({min:1}),
    // Sanitize (escape) the name field.
    validator.sanitizeBody('name').escape(),
    // Process request after validation and sanitization.
    (req, res, next)=>{
        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre(
            { 
                name: req.body.name,
                _id: req.params.id
            }
        );        

        if(!errors.isEmpty())
        {
            res.render('genre_form', {title:'Update Genre', genre: genre, errors:errors.array()});
            return; 
        }
        else{
            // data from form is valid
            Genre.findByIdAndUpdate(genre._id, genre, {}, function(err, updatedGenre){
                if(err){return next(err);}
                res.redirect(updatedGenre.url);
            })            
        }
    }
]