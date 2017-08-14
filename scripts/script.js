const bookOrMovieApp = {};

bookOrMovieApp.GoodreadsKey = "dy5MEVDCeMkbKhqkeltAQ";
bookOrMovieApp.tmdbKey = "8af8d5191fcc5c6702e2a150268afcdc";

// Global variables - updated within functions
bookOrMovieApp.usersChoiceTitle = "";
bookOrMovieApp.bookRating = 0;
bookOrMovieApp.movieRating = 0;
bookOrMovieApp.title = "";
bookOrMovieApp.author = "";
bookOrMovieApp.bookImage = "";
bookOrMovieApp.moviePoster = "";
bookOrMovieApp.movieSummary = "";
bookOrMovieApp.director = "";
bookOrMovieApp.finalResult = "";


bookOrMovieApp.init = function() {
	bookOrMovieApp.getUserBookChoice();
}


bookOrMovieApp.getUserBookChoice = function() {
	$("form input[type='text']").on("click focus", function() {		
		$(this).css("border-bottom", "none");
	});

	$("form").on("submit", function(e) {
		e.preventDefault();

		bookOrMovieApp.usersChoiceTitle = $("input[name=bookTitle]").val();
		// author's last name must be written first in search query in order for the correct book to be listed as the first object in the results work array
		var usersChoiceAuthor = $("input[name=authorLastName]").val() + " " + $("input[name=authorFirstName]").val();
		var usersChoiceFinal = bookOrMovieApp.usersChoiceTitle + ", " + usersChoiceAuthor;

		bookOrMovieApp.getBookRating(usersChoiceFinal);

		$("input[name=bookTitle], input[name=authorFirstName], input[name=authorLastName]").val("");
		$("input[name=bookTitle], input[name=authorFirstName], input[name=authorLastName]").css("border-bottom", "1px dotted black")
	});
}


// Get the user's book choice rating from Goodreads
bookOrMovieApp.getBookRating = function(usersChoiceFinal) {
	$.ajax({
		url: "http://proxy.hackeryou.com",
		method: "GET",
		dataType: "json",
		data: {
			reqUrl: "https://www.goodreads.com/search/index.xml",
			params: {
				key: bookOrMovieApp.GoodreadsKey,
				q: usersChoiceFinal,
				search: "all"
			},
			xmlToJSON: true
		}
	}).then(function(res) {
		res = res.GoodreadsResponse.search.results.work;

		// If the response gives back an array of books, choose the first book in the array as the final response
		if (Array.isArray(res)) {
			res = res[0];
		}

		if (res === undefined) {
			alert("Are you sure you've spelled the title and author's name correctly?");
		}


		bookOrMovieApp.title = res.best_book.title;
		bookOrMovieApp.author = res.best_book.author.name; 
		bookOrMovieApp.bookImage = res.best_book.image_url;
		// Goodreads api gives the rating as a string
		bookOrMovieApp.bookRating = parseFloat(res.average_rating).toFixed(2);

		bookOrMovieApp.getMovieRating();
	});
}


// Get corresponding movie rating based on user's book choice
bookOrMovieApp.getMovieRating = function() {
	$.ajax({
		url: "https://api.themoviedb.org/3/search/movie",
		method: "GET",
		dataType: "json",
		data: {
			api_key: bookOrMovieApp.tmdbKey,
			// Use the user's input as the title instead of Goodreads title because of the way Goodreads title is sometimes formatted - sometimes causes tmdb api to not recognize the title and return undefined
			query: bookOrMovieApp.usersChoiceTitle
		}
	}).then(function(res) {
		res = res.results[0];

		if (res === undefined) {
			alert("This book hasn't been made into a movie (yet...)!");
		} else {
			// Rating from tmdb is out of 10 vs. Goodreads rating is out of 5 
			bookOrMovieApp.movieRating = (res.vote_average / 2).toFixed(2);
			bookOrMovieApp.moviePoster = res.poster_path;
			bookOrMovieApp.movieSummary = res.overview;
		

			if (bookOrMovieApp.bookRating > bookOrMovieApp.movieRating) {
				bookOrMovieApp.finalResult = "Read the book! Don't watch the movie!";
			} else {
				bookOrMovieApp.finalResult = "Time to make some popcorn for the movie!";
			};

			var movieId = res.id;
			bookOrMovieApp.getMovieCredits(movieId);
		}
	});	
}

// Get director's name
bookOrMovieApp.getMovieCredits = function(movieId) {
	$.ajax({
		url: `https://api.themoviedb.org/3/movie/${movieId}/credits`,
		method: "GET",
		dataType: "json",
		data: {
			api_key: bookOrMovieApp.tmdbKey
		}
	}).then(function(res) {
		var crew = res.crew;
		crew.filter(function(person) {
			if (person.job === "Director") {
				bookOrMovieApp.director = person.name;
			};
		});

		bookOrMovieApp.displayAllResults();
	});
}


// Display the info/results on the page
bookOrMovieApp.displayAllResults = function() {
	$("#finalResults").html(`<h2>${bookOrMovieApp.finalResult}</h2>`);
	$("#title").text(bookOrMovieApp.title);
	$("#credits").html(`<p>Written by</p>
		<p>${bookOrMovieApp.author}</p>
		<p>Directed by</p>
		<p>${bookOrMovieApp.director}</p>`);
	$("#overview").text(`SYNOPSIS: ${bookOrMovieApp.movieSummary}`);

	//Replace the m/ in the image url with a l/ and keep the numbers
	// .replace(/(\d)(m\/)/,"$1l/") - larger & clearer image than the one the api gives in results
	// With some books, no book cover is available because Goodreads doesn't have permission to distribute third party image
	$("#bookResults").html(`<h4>Book's Average Rating: <span class="bookRating">${bookOrMovieApp.bookRating}</span></h4>
		<img src="${bookOrMovieApp.bookImage.replace(/(\d)(m\/)/,"$1l/")}">`);
	
	$("#movieResults").html(`<h4>Movie's Average Rating: <span class="movieRating">${bookOrMovieApp.movieRating}</span></h4>
		<img src="https://image.tmdb.org/t/p/w300${bookOrMovieApp.moviePoster}">`);
	
	if (bookOrMovieApp.finalResult === "Read the book! Don't watch the movie!") {
		$(".bookRating").css("color", "green");
		$(".movieRating").css("color", "red");
		$(".bookResults img").delay(2000).queue(function() {
			$(".bookResults img").addClass("winner");
			setTimeout(function() {
				$(".bookResults img").removeClass("winner");
			}, 2000);
		});
	} else {
		$(".bookRating").css("color", "red");
		$(".movieRating").css("color", "green");
		$(".movieResults img").delay(2000).queue(function() {
			$(".movieResults img").addClass("winner");
			setTimeout(function() {
				$(".movieResults img").removeClass("winner");
			}, 2000);
		});
	}


	$('html, body').animate({
         scrollTop: $("#finalResults").offset().top
    }, 1000);
}



$(function() {
	bookOrMovieApp.init();

	$("h1").typed({
		strings: ["Read <span>or</span> Watch?"],
		typeSpeed: 100,
		startDelay: 100,
		showCursor: false
	});
});