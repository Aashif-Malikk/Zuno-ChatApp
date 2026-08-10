const { User } = require("../Mongo/Schema")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretkey = process.env.SECRET_KEY;

function issueToken(res, user) {
    const token = jwt.sign(
        { userId: user._id, name: user.name },
        secretkey,
        { expiresIn: '7d' }
    );

    return token;
}

exports.userRegister = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        // console.log(req.body)

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Full name, email, password are required' });
        }

        const userfound = await User.findOne({ name });
        if (userfound) {
            return res.status(409).json({ message: "Username already exists!" });
        }

        const uniqueId = Math.random().toString(36).substring(3, 10).toUpperCase(); // Generate a random unique ID
        const hashedPassword = await bcrypt.hash(password, 10);

        const newuser = new User({
            _id: uniqueId,
            name: name,
            email,
            password: hashedPassword,
            isloggedin: true, // logging them in immediately, no separate login step,
            phone: phone
        });

        await newuser.save();

        const token = issueToken(res, newuser);
        return res.status(201).json({ token, success: true, user: newuser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Registration failed!" });
    }
}

exports.userLogin = async (req, res) => {
    try {
        const { name, password } = req.body;
        console.log(req.body)

        if (!name || !password) {
            return res.status(400).json({ error: 'Name and password are required' });
        }

        // const user = await User.findOne({
        //     $or: [
        //         { name: name },
        //         { _id: name }
        //     ]
        // });
        const user = await User.findOne({ name: name });

        // console.log(user)
        if (!user) {
            return res.status(404).json({ message: "User not found!", success: false });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password!", success: false });
        }

        const token = issueToken(res, user);
        user.isloggedin = true;
        await user.save();

        return res.status(200).json({ token, message: 'Login successful', user, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Login failed!", success: false });
    }
}

exports.userLogout = async (req, res) => {
    try {
        const userId = req.userId;
        console.log(userId)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isloggedin = false;
        await user.save();
        return res.json({ message: 'Logout successful', success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
