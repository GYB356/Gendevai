// Proactive codebase analysis and opportunity detection
import { GenerationStatus } from "@gendevai/database";
import { openai } from "./client";
import { MODELS, SYSTEM_PROMPTS } from "./models";
import { GitHubIntegration } from "./version-control";

// Types of opportunities that can be detected
export enum OpportunityType {
  TECH_DEBT = "TECH_DEBT",
  SECURITY_VULNERABILITY = "SECURITY_VULNERABILITY",
  PERFORMANCE_ISSUE = "PERFORMANCE_ISSUE",
  OUTDATED_DEPENDENCY = "OUTDATED_DEPENDENCY",
  MISSING_DOCUMENTATION = "MISSING_DOCUMENTATION",
  POTENTIAL_BUG = "POTENTIAL_BUG",
  CODE_SMELL = "CODE_SMELL",
  REFACTORING_OPPORTUNITY = "REFACTORING_OPPORTUNITY"
}

// Interface for detected opportunities
export interface CodebaseOpportunity {
  id?: string;
  type: OpportunityType;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  filePath?: string;
  lineNumbers?: [number, number]; // Start and end line
  suggestedFix?: string;
  codeSnippet?: string;
  detectedAt: Date;
  repositoryId?: string;
  projectId?: string;
}

/**
 * Service to analyze codebases and detect improvement opportunities
 */
export class CodebaseAnalysisService {
  private githubIntegration?: GitHubIntegration;
  
  constructor(options?: {
    githubConfig?: {
      appId: string;
      privateKey: string;
      clientId: string;
      clientSecret: string;
    };
  }) {
    if (options?.githubConfig) {
      this.githubIntegration = new GitHubIntegration(options.githubConfig);
    }
  }

  /**
   * Analyzes a single file for potential improvement opportunities
   */
  async analyzeFile(
    fileContent: string,
    options: {
      filePath: string;
      language: string;
      opportunityTypes?: OpportunityType[];
    }
  ): Promise<CodebaseOpportunity[]> {
    try {
      // Filter opportunity types or use all if not specified
      const opportunityTypes = options.opportunityTypes || Object.values(OpportunityType);
      
      // Build a prompt specific to the file and opportunity types
      const prompt = `
Please analyze the following ${options.language} code file and identify potential improvement opportunities.
Focus specifically on these types of opportunities: ${opportunityTypes.join(', ')}.

For each opportunity you find, provide:
1. The type of opportunity (one of: ${opportunityTypes.join(', ')})
2. A short title for the opportunity
3. A detailed description of the issue
4. The severity (LOW, MEDIUM, HIGH, or CRITICAL)
5. The approximate line numbers where the issue is located
6. A suggested fix or improvement
7. The relevant code snippet

File path: ${options.filePath}

\`\`\`${options.language}
${fileContent}
\`\`\`

Format your response as a JSON array where each item represents one opportunity, like this:
[
  {
    "type": "OPPORTUNITY_TYPE",
    "title": "Short descriptive title",
    "description": "Detailed explanation of the issue",
    "severity": "SEVERITY_LEVEL",
    "lineNumbers": [startLine, endLine],
    "suggestedFix": "Explanation or code showing how to fix it",
    "codeSnippet": "The problematic code snippet"
  }
]

If you don't find any opportunities of the specified types, return an empty array [].
`;

      const completion = await openai.chat.completions.create({
        model: MODELS.ANALYSIS,
        messages: [
          { 
            role: "system", 
            content: "You are an expert code analyzer that specializes in identifying code improvement opportunities. You have deep knowledge of software best practices, common bugs, security vulnerabilities, and code smells. Your analysis is thorough and practical." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = completion.choices[0]?.message.content || "[]";
      
      try {
        // Parse the response as JSON
        const opportunities: CodebaseOpportunity[] = JSON.parse(result).map((opp: any) => ({
          ...opp,
          detectedAt: new Date(),
          repositoryId: options.filePath.split('/')[0], // Simplified; would need proper repo ID in real implementation
        }));
        
        return opportunities;
      } catch (parseError) {
        console.error("Failed to parse opportunities JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("File analysis error:", error);
      return [];
    }
  }

  /**
   * Analyzes a repository for potential improvement opportunities
   */
  async analyzeRepository(
    options: {
      owner: string;
      repo: string;
      branch?: string;
      maxFilesToAnalyze?: number;
      opportunityTypes?: OpportunityType[];
      fileExtensions?: string[];
    }
  ): Promise<{
    opportunities: CodebaseOpportunity[];
    status: GenerationStatus;
  }> {
    if (!this.githubIntegration) {
      return {
        opportunities: [],
        status: GenerationStatus.FAILED,
      };
    }

    try {
      // Get repository content (simplified - in real implementation would need to recursively fetch files)
      const fileContents: { path: string; content: string; }[] = [];
      
      // This is a simplified implementation - in a real scenario, you would:
      // 1. Fetch the file tree from GitHub
      // 2. Filter by the specified file extensions
      // 3. Limit to the max number of files to analyze
      // 4. Fetch the content of each file
      
      // For example, you might do something like:
      // const fileTree = await this.githubIntegration.getRepositoryContents(options.owner, options.repo, options.branch);
      // const filteredFiles = fileTree.filter(file => 
      //   options.fileExtensions?.some(ext => file.path.endsWith(ext)) || true
      // ).slice(0, options.maxFilesToAnalyze || 10);
      
      // for (const file of filteredFiles) {
      //   const content = await this.githubIntegration.getFileContent(options.owner, options.repo, file.path, options.branch);
      //   fileContents.push({ path: file.path, content });
      // }
      
      // Analyze each file
      const allOpportunities: CodebaseOpportunity[] = [];
      
      for (const file of fileContents) {
        // Detect language based on file extension
        const extension = file.path.split('.').pop() || '';
        const languageMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'py': 'python',
          'java': 'java',
          'cs': 'csharp',
          'go': 'go',
          'rb': 'ruby',
          'php': 'php',
          'swift': 'swift',
          'kt': 'kotlin',
          'rs': 'rust',
          'cpp': 'cpp',
          'c': 'c',
          'h': 'c',
          'hpp': 'cpp',
        };
        const language = languageMap[extension] || 'unknown';
        
        // Skip files with unknown language
        if (language === 'unknown') continue;
        
        const fileOpportunities = await this.analyzeFile(file.content, {
          filePath: file.path,
          language,
          opportunityTypes: options.opportunityTypes,
        });
        
        allOpportunities.push(...fileOpportunities);
      }
      
      return {
        opportunities: allOpportunities,
        status: GenerationStatus.COMPLETED,
      };
    } catch (error) {
      console.error("Repository analysis error:", error);
      return {
        opportunities: [],
        status: GenerationStatus.FAILED,
      };
    }
  }

  /**
   * Provides a high-level summary of a codebase analysis
   */
  async generateAnalysisSummary(opportunities: CodebaseOpportunity[]): Promise<string> {
    if (opportunities.length === 0) {
      return "No improvement opportunities were detected in the analyzed codebase.";
    }

    try {
      // Group opportunities by type
      const opportunitiesByType: Record<string, CodebaseOpportunity[]> = {};
      
      opportunities.forEach(opp => {
        if (!opportunitiesByType[opp.type]) {
          opportunitiesByType[opp.type] = [];
        }
        opportunitiesByType[opp.type].push(opp);
      });
      
      // Group by severity
      const bySeverity = {
        CRITICAL: opportunities.filter(o => o.severity === "CRITICAL").length,
        HIGH: opportunities.filter(o => o.severity === "HIGH").length,
        MEDIUM: opportunities.filter(o => o.severity === "MEDIUM").length,
        LOW: opportunities.filter(o => o.severity === "LOW").length,
      };
      
      // Generate a prompt for the summary
      const prompt = `
I need a summary of a codebase analysis. Here are the results:

Total opportunities found: ${opportunities.length}

Severity breakdown:
- Critical: ${bySeverity.CRITICAL}
- High: ${bySeverity.HIGH}
- Medium: ${bySeverity.MEDIUM}
- Low: ${bySeverity.LOW}

Types of opportunities:
${Object.entries(opportunitiesByType).map(([type, opps]) => 
  `- ${type}: ${opps.length} issues`
).join('\n')}

Top issues (up to 5):
${opportunities
  .sort((a, b) => {
    const severityWeight = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
    return (severityWeight[b.severity as keyof typeof severityWeight] || 0) - 
           (severityWeight[a.severity as keyof typeof severityWeight] || 0);
  })
  .slice(0, 5)
  .map(opp => `- [${opp.severity}] ${opp.title}: ${opp.description.substring(0, 100)}...`)
  .join('\n')}

Please provide a concise, actionable summary of this codebase analysis that highlights key patterns, prioritizes what should be addressed first, and offers general recommendations for improving the codebase. Include a suggested action plan based on the severity and types of issues found.
`;

      const completion = await openai.chat.completions.create({
        model: MODELS.ANALYSIS,
        messages: [
          { 
            role: "system", 
            content: "You are an expert software architect that specializes in codebase health analysis and technical debt management. You provide clear, actionable summaries and strategic recommendations." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
      });

      return completion.choices[0]?.message.content || "No summary available.";
    } catch (error) {
      console.error("Analysis summary generation error:", error);
      return "Failed to generate analysis summary due to an error.";
    }
  }
}
