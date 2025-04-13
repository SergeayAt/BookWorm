import express from 'express';
import cloudinary from '../lib/cloudinary.js';
import Book from '../models/Book.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protectRoute, async (req, res) => {
    try {
        const { title, caption, rating, image } = req.body;

        if(!image) {
            return res.status(400).json({ message: "Please provide an image" });
        }
        if(!title || !caption || !rating) {
            return res.status(400).json({ message: "Please provide all fields" });
        }

        // upload the image to cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(image, {
            folder: 'books',
        });
        const imageUrl = cloudinaryResponse.secure_url;

        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id, // Assuming you have user information in req.user
        });

        await newBook.save();
        res.status(201).json(newBook);
        
    } catch (error) {
        console.error("Error creating book:", error);
        res.status(500).json({ message: "Error in creating book" });
    }

});

router.get('/', protectRoute, async (req, res) => {
    try {
// pagination => infinte scrolling-loading
        const page = req.query.page || 1;
        const limit = req.query.limit || 5;
        const skip = (page - 1) * limit;

        const books = await Book.find()
        .sort({ created: -1 }) // desc
        .skip(skip)
        .limit(limit)
        .populate("user", "username profileImage");

        const totalBooks = await Book.countDocuments

        res.send({
            books,
            currentPage: page,
            totalBooks: totalBooks,
            totalPages: Math.ceil(totalBooks / limit)
        
        })

    } catch (error) {
        console.log("Error in get all books route", error);
        res.status(500).json({ message: "Internal server error "})
    }
});

router.get("user", protectRoute, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user._id })
            .sort({ created: -1 }) // desc
            .populate("user", "username profileImage");

        res.status(200).json(books);
    } catch (error) {
        console.error("Error fetching user's books:", error);
        res.status(500).json({ message: "Error fetching user's books" });
    }
});

router.delete("/:id", protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(bookId);

        if(!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Check if the user is the owner of the book
        if (book.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this book" });
        }

        // Delete the image from cloudinary
        if (book.image && book.image.startsWith("http")) {
            try {
                const publicId = book.image.split("/").pop().split(".")[0]; // Extract the public identifier from the URL
                await cloudinary.uploader.destroy(`books/${publicId}`, {
                    resource_type: "image",
                });
            } catch (deleteError) {
                console.error("Error deleting image from cloudinary:", deleteError);
                return res.status(500).json({ message: "Error deleting image from cloudinary" });
            }
        }

        await book.deleteOne();

    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ message: "Error deleting book" });
    }
});

export default router;