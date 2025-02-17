const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const getTotalQuestions = async () => {
    const query = `{
        allQuestionsCount {
            difficulty
            count
        }
    }`;

    try {
        const response = await axios.post(
            "https://leetcode.com/graphql",
            { query },
            { headers: { "Content-Type": "application/json" } }
        );
        return response.data.data.allQuestionsCount;
    } catch (error) {
        console.error("Error fetching total questions:", error.response?.data || error.message);
        return null;
    }
};

const getLeetCodeStats = async (username) => {
    const query = `{
        matchedUser(username: "${username}") {
            username
            submitStats: submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            profile {
                ranking
                reputation
            }
        }
    }`;

    try {
        const response = await axios.post(
            "https://leetcode.com/graphql",
            { query },
            { headers: { "Content-Type": "application/json" } }
        );

        if (!response.data.data.matchedUser) {
            console.log(`User ${username} not found in LeetCode API.`);
            return null;
        }
        return response.data.data.matchedUser;
    } catch (error) {
        console.error("LeetCode API Error:", error.response?.data || error.message);
        return null;
    }
};

app.get("/api/leetcode/:username", async (req, res) => {
    const { username } = req.params;

    const [userData, totalQuestions] = await Promise.all([
        getLeetCodeStats(username),
        getTotalQuestions()
    ]);

    if (!userData) return res.status(404).json({ error: "User not found or API failed" });

    const stats = {
        username: userData.username,
        ranking: userData.profile.ranking,
        reputation: userData.profile.reputation,
        problemsSolved: {
            easy: userData.submitStats.acSubmissionNum[1].count,
            medium: userData.submitStats.acSubmissionNum[2].count,
            hard: userData.submitStats.acSubmissionNum[3].count,
            total: userData.submitStats.acSubmissionNum[0].count,
        },
        totalQuestions: {
            easy: totalQuestions[1].count,
            medium: totalQuestions[2].count,
            hard: totalQuestions[3].count,
            all: totalQuestions[0].count,
        }
    };

    res.json(stats);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
