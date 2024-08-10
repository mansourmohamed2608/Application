const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillsController");
const auth = require("../middleware/auth");

router.post("/addSkill", auth, skillController.createSkill);
router.put("/updateSkill/:skillId", auth, skillController.updateSkill);
router.get("/GetSkills", auth, skillController.getSkills);
router.delete("/deleteSkill/:skillId", auth, skillController.deleteSkill);

module.exports = router;
