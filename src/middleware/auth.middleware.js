import jwt from 'jsonwebtoken';
import User from '../models/User.js';


// const response = await fetch('https://localhost:3000/api/books', {
//     method: 'POST',
//     body: JSON.stringify({
//         title,
//         caption
//     }),
//     headers: {
//         Authorization: `Bearer ${token}`
//     }
// });

const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers("Authorization").replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the user exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        // Attach the user to the request object
        req.user = user;
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ message: "Invalid token" });
    }
}

export default protectRoute;