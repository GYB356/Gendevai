import { AISkillService, EXAMPLE_SKILLS } from "@gendevai/ai-core";
import { db } from "@gendevai/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route for AI Skill Marketplace
 */
export async function GET(req: NextRequest) {
  try {
    // Query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const isVerified = searchParams.get("verified") === "true";
    
    // Get example skills (in a real implementation, this would query the database)
    const skills = Object.values(EXAMPLE_SKILLS);
    
    // Filter skills based on query parameters
    const filteredSkills = skills.filter(skill => {
      // Filter by search query
      if (query && !skill.name.toLowerCase().includes(query.toLowerCase()) && 
          !skill.description.toLowerCase().includes(query.toLowerCase()) &&
          !skill.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
        return false;
      }
      
      // Filter by category
      if (category && skill.category !== category) {
        return false;
      }
      
      // Filter by verification status
      if (isVerified && !skill.isVerified) {
        return false;
      }
      
      return true;
    });
    
    return NextResponse.json({
      skills: filteredSkills,
      total: filteredSkills.length,
      categories: Array.from(new Set(skills.map(s => s.category))),
    });
  } catch (error) {
    console.error("Error in skills API:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

/**
 * Execute a skill with the provided inputs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillId, inputs, temperature } = body;
    
    if (!skillId || !inputs) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Get the skill from example skills (in a real implementation, fetch from DB)
    const skill = Object.values(EXAMPLE_SKILLS).find(s => s.id === skillId);
    
    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    
    // Execute the skill
    const skillService = new AISkillService();
    const result = await skillService.executeSkill(
      skill,
      inputs,
      { temperature: temperature || 0.5 }
    );
    
    // In a real implementation, save execution stats to DB
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing skill:", error);
    return NextResponse.json(
      { error: "Failed to execute skill" },
      { status: 500 }
    );
  }
}
