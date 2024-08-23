const mongoose = require("mongoose");
const Skill = require("../models/skill");
const User = require("../models/User");

// Create a new skill
exports.createSkill = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ msg: "Skill title is required" });
  }

  try {
    const skill = new Skill({
      userId: req.user.id,
      title,
    });

    const savedSkill = await skill.save();
    res.json(savedSkill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update an existing skill
exports.updateSkill = async (req, res) => {
  const { skillId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ msg: "Skill title is required" });
  }

  try {
    const skill = await Skill.findById(skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Ensure the user owns the skill
    if (skill.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    skill.title = title;
    const updatedSkill = await skill.save();

    res.json(updatedSkill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete a skill
exports.deleteSkill = async (req, res) => {
  const { skillId } = req.params;

  try {
    const skill = await Skill.findById(skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Ensure the user owns the skill
    if (skill.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await skill.remove();
    res.json({ msg: "Skill removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get all skills for the logged-in user
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.user.id });
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
