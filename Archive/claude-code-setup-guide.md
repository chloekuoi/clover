# Claude Code Setup - Quick Start Guide

## ✅ What's Been Set Up

Your Claude Code environment is now configured with:

### 📁 Directory Structure
```
~/.claude/
├── README.md                          # Complete documentation
├── skills/                            # 6 workflow skills
│   ├── refactor-clean.md
│   ├── tdd-workflow.md
│   ├── e2e-testing.md
│   ├── test-coverage.md
│   ├── codemap-updater.md
│   └── coding-standards.md
├── commands/                          # 5 quick commands
│   ├── quick-fix.md
│   ├── code-review.md
│   ├── optimize.md
│   ├── explain.md
│   └── debug.md
└── hooks/                             # Ready for custom hooks
```

## 🚀 How to Use Right Now

### In Claude Code Terminal:

#### 1. Clean up dead code
```bash
claude "Using /refactor-clean, help me clean up the src/ directory"
```

#### 2. Quick fix for errors
```bash
claude "/quick-fix"
```

#### 3. Add tests to a file
```bash
claude "Following /tdd-workflow, add tests for UserService.ts"
```

#### 4. Chain multiple operations
```bash
claude "In @src/components/, /refactor-clean then /test-coverage then /code-review"
```

#### 5. Update codebase map
```bash
claude "Using /codemap-updater, scan the project"
```

## 📝 Key Concepts

### Skills vs Commands vs Hooks

| Type | Purpose | When to Use | Example |
|------|---------|-------------|---------|
| **Skills** | Workflow guidelines & best practices | When you need Claude to follow a methodology | `/refactor-clean`, `/tdd-workflow` |
| **Commands** | Quick executable prompts | For common repeatable tasks | `/quick-fix`, `/code-review` |
| **Hooks** | Automated triggers on events | For automatic actions on tool calls | Auto-update codemap on file changes |

### The Power of Chaining

The real magic happens when you chain skills and commands:

```bash
# Full cleanup workflow
claude "In @src/hooks/ can you /refactor-clean, then /test-coverage, 
finally do a run of /code-review"
```

This executes three operations in sequence:
1. Cleans dead code using refactor-clean skill
2. Analyzes test coverage
3. Performs comprehensive code review

## 🎯 Common Workflows

### Workflow 1: Starting a New Feature
```bash
# 1. Understand the codebase
claude "Using /codemap-updater, show me the structure"

# 2. Follow TDD
claude "Following /tdd-workflow, let's build the new payment feature"

# 3. Ensure coverage
claude "/test-coverage on the new PaymentService"
```

### Workflow 2: Refactoring Legacy Code
```bash
# 1. Review current state
claude "/code-review for src/legacy/"

# 2. Clean it up
claude "Using /refactor-clean and /coding-standards, refactor src/legacy/UserAuth.ts"

# 3. Add tests
claude "Following /tdd-workflow, add comprehensive tests"
```

### Workflow 3: Debugging Issues
```bash
# 1. Quick analysis
claude "/debug the authentication error"

# 2. If needed, detailed review
claude "Using /coding-standards, review our auth implementation"

# 3. Fix and optimize
claude "/quick-fix then /optimize the auth flow"
```

## 🛠️ Customizing for Your Project

### Add Project-Specific Skills

Create a `.claude/skills/` directory in your project root:

```bash
mkdir -p .claude/skills
```

Then add project-specific skills:

```bash
# Example: API guidelines
cat > .claude/skills/api-guidelines.md << 'EOF'
# API Development Guidelines

## REST API Standards
- Use HTTP verbs correctly (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Version APIs (v1, v2)
- Include pagination for lists

## Authentication
- Use JWT tokens
- Include rate limiting
- Validate all inputs
EOF
```

Now Claude will use both global and project-specific skills!

### Create Custom Commands

```bash
# Example: Deploy command
cat > ~/.claude/commands/deploy.md << 'EOF'
Guide me through the deployment checklist:
1. Run all tests
2. Build production bundle
3. Check environment variables
4. Review deployment config
5. Execute deployment
6. Verify deployment health
EOF
```

## 💡 Pro Tips

1. **Start Simple**: Use single commands first (`/quick-fix`, `/explain`)
2. **Chain for Complex Tasks**: Combine multiple skills for big refactors
3. **Update Your Codemap**: Run `/codemap-updater` after major changes
4. **Customize as You Go**: Edit skills to match your team's practices
5. **Share with Team**: Commit `.claude/` to version control

## 🔍 Viewing Your Skills

Anytime you want to see what's available:

```bash
# List all skills
ls ~/.claude/skills/

# Read a specific skill
cat ~/.claude/skills/refactor-clean.md

# List all commands
ls ~/.claude/commands/
```

## 📚 Next Steps

1. **Try it out**: Pick a file in your project and run `/code-review`
2. **Customize**: Edit `coding-standards.md` to match your team's style
3. **Add project skills**: Create `.claude/skills/` in your project
4. **Experiment with chaining**: Try combining multiple operations
5. **Read the full README**: Check `~/.claude/README.md` for more details

## 🆘 Troubleshooting

**Claude doesn't recognize my skills:**
- Make sure files are in `~/.claude/skills/` or `./.claude/skills/`
- Check that files end with `.md`
- Verify file permissions: `ls -la ~/.claude/skills/`

**Commands not working:**
- Commands use slash syntax: `/command-name`
- Skills are referenced: `/skill-name` or "using /skill-name"
- Try without the slash: "using refactor-clean skill"

**Want to add hooks:**
- Hooks are advanced - start with skills/commands first
- Check Claude Code documentation for hook examples
- Place hooks in `~/.claude/hooks/`

---

**Happy coding! 🚀**

Remember: These skills and commands are living documents. Update them as you discover better practices!
