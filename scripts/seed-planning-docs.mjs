#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv() {
  const lines = readFileSync(resolve(ROOT, ".env.local"), "utf-8").split("\n");
  const env = {};
  for (const l of lines) {
    const t = l.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}
const env = loadEnv();
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" };

const PID = "b233064a-d478-4915-bec5-dda260457853";

const docs = [
  {
    project_id: PID, doc_type: "context_priming", phase: "research",
    title: "Personal Management \u2014 \ub9ac\uc11c\uce58",
    summary: "\uac1c\uc778 \uc0dd\uc0b0\uc131\uacfc \ud559\uc2b5/\ud504\ub85c\uc81d\ud2b8\ub97c \ud55c \uacf3\uc5d0\uc11c \uad00\ub9ac\ud558\ub294 \uc6f9 \ub300\uc2dc\ubcf4\ub4dc. Claude Code\uc640 \uc5f0\ub3d9\ud558\uc5ec \uc138\uc158 \ub85c\uadf8 \uc790\ub3d9 \uc5c5\ub85c\ub4dc, AI \ud559\uc2b5 \uc694\uc57d, \ud504\ub85c\uc81d\ud2b8 \uae30\ud68d\uae4c\uc9c0 \ud1b5\ud569.",
    key_decisions: [
      "Next.js 15 + Supabase + Vercel \uc2a4\ud0dd\uc73c\ub85c \ud655\uc815",
      "\ub2e8\uc77c \uc0ac\uc6a9\uc790 \uc804\uc6a9 (snu9026@gmail.com \ud654\uc774\ud2b8\ub9ac\uc2a4\ud2b8)",
      "Claude Code \uc2a4\ud0ac \uc2dc\uc2a4\ud15c\uacfc \uc9c1\uc811 \uc5f0\ub3d9\ud558\uc5ec \uc790\ub3d9\ud654",
      "Anthropic API\ub85c \ud559\uc2b5 \ucf58\ud150\uce20 AI \uc694\uc57d \uc0dd\uc131"
    ],
    sections: [
      {
        title: "\ubb38\uc81c \uc815\uc758",
        type: "overview", layout: "definition",
        key_message: "\ud559\uc2b5, \ud504\ub85c\uc81d\ud2b8, \uc2a4\ud0ac \uad00\ub9ac\uac00 \ubd84\uc0b0\ub418\uc5b4 \uc788\uc5b4 \ud1b5\ud569 \ub300\uc2dc\ubcf4\ub4dc\uac00 \ud544\uc694\ud558\ub2e4",
        content: "",
        points: [
          { term: "\ud575\uc2ec \ubb38\uc81c", explanation: "\ud559\uc2b5 \ub178\ud2b8, \ud504\ub85c\uc81d\ud2b8 \uc9c4\ud589\uc0c1\ud669, Claude Code \uc2a4\ud0ac\uc774 \uac01\uac01 \ub2e4\ub978 \uacf3\uc5d0 \ud769\uc5b4\uc838 \uc788\uc5b4 \uc804\uccb4 \ud604\ud669 \ud30c\uc545\uc774 \uc5b4\ub824\uc6c0" },
          { term: "\uc11c\ube44\uc2a4 \uac00\uce58", explanation: "\ud558\ub098\uc758 \uc6f9 \ub300\uc2dc\ubcf4\ub4dc\uc5d0\uc11c \ud559\uc2b5\u00b7\ud504\ub85c\uc81d\ud2b8\u00b7\uc2a4\ud0ac\u00b7\uc9c4\ud589\ub960\uc744 \ud55c\ub208\uc5d0 \ubcf4\uace0 \uad00\ub9ac" },
          { term: "\ud0c0\uac9f \uc0ac\uc6a9\uc790", explanation: "\ubcf8\uc778(\uac1c\ubc1c\uc790) 1\uc778. Claude Code\ub97c \uc8fc\ub825 \ub3c4\uad6c\ub85c \uc0ac\uc6a9\ud558\ub294 \uac1c\uc778 \uac1c\ubc1c\uc790" }
        ]
      },
      {
        title: "\uae30\uc220 \uc2a4\ud0dd",
        type: "spec", layout: "table",
        key_message: "Next.js + Supabase + Anthropic API + Vercel \uc870\ud569",
        content: "| \uc601\uc5ed | \uae30\uc220 | \uc5ed\ud560 |\n|---|---|---|\n| \ud504\ub860\ud2b8\uc5d4\ub4dc | Next.js 15, React 19, Tailwind CSS | App Router, SSR |\n| \ubc31\uc5d4\ub4dc/DB | Supabase (PostgreSQL + Auth) | \ub370\uc774\ud130 \uc800\uc7a5, Google OAuth |\n| AI | Anthropic Claude API | \ud559\uc2b5 \uc694\uc57d, \uc138\uc158 \ub85c\uadf8 \uc694\uc57d |\n| \ubc30\ud3ec | Vercel | \uc790\ub3d9 \ubc30\ud3ec |\n| \ubb38\uc11c \ucc98\ub9ac | mammoth, jsPDF, react-markdown | docx \ud30c\uc2f1, PDF \uc0dd\uc131 |",
        points: []
      },
      {
        title: "MVP \ubc94\uc704",
        type: "overview", layout: "bullets",
        key_message: "5\uac1c \ud575\uc2ec \ud398\uc774\uc9c0 + AI \uc694\uc57d + \uc138\uc158 \ub85c\uadf8 \uc790\ub3d9 \uc5c5\ub85c\ub4dc",
        content: "- \u2705 \ud559\uc2b5 \ucf58\ud150\uce20 \uc5c5\ub85c\ub4dc \ubc0f AI \uc2ac\ub77c\uc774\ub4dc \ubcc0\ud658 (/study)\n- \u2705 \ud559\uc2b5 \ub9ac\ud3ec\ud2b8 \ub77c\uc774\ube0c\ub7ec\ub9ac (/library)\n- \u2705 \ud504\ub85c\uc81d\ud2b8 \uad00\ub9ac + \ud0c0\uc784\ub77c\uc778 \ub85c\uadf8 (/projects)\n- \u2705 \uc8fc\uac04 \uc9c4\ud589\ub960 \ub300\uc2dc\ubcf4\ub4dc (/goals)\n- \u2705 Claude Code \uc2a4\ud0ac \ub808\uc9c0\uc2a4\ud2b8\ub9ac (/skills)\n- \u2705 update.recent \uc790\ub3d9 \uc138\uc158 \uc694\uc57d \uc5c5\ub85c\ub4dc\n- \u2705 Google OAuth \uc778\uc99d",
        points: []
      }
    ],
    dev_notes: { claude_prompt_hint: "\uc774 \ud504\ub85c\uc81d\ud2b8\ub294 \ub2e8\uc77c \uc0ac\uc6a9\uc790 \uc804\uc6a9 \ub300\uc2dc\ubcf4\ub4dc. \ubaa8\ub4e0 API\ub294 requireUser()\ub85c \ubcf4\ud638.", dependencies: ["Supabase", "Anthropic API", "Vercel"], risks: ["API \ube44\uc6a9 \uad00\ub9ac"] },
    tags: ["setup", "\uae30\ub2a5\ucd94\uac00"]
  },
  {
    project_id: PID, doc_type: "feature_spec", phase: "feature",
    title: "Personal Management \u2014 \uae30\ub2a5 \uba85\uc138",
    summary: "6\uac1c \uc8fc\uc694 \uc139\uc158\uc73c\ub85c \uad6c\uc131. \ud559\uc2b5 \uc5c5\ub85c\ub4dc/\ub77c\uc774\ube0c\ub7ec\ub9ac, \ud504\ub85c\uc81d\ud2b8 \uad00\ub9ac, \uc9c4\ud589\ub960 \ub300\uc2dc\ubcf4\ub4dc, \uc2a4\ud0ac \uad00\ub9ac, \uc778\uc99d.",
    key_decisions: [
      "\ud559\uc2b5 \uc694\uc57d\uc740 Anthropic Claude Sonnet\uc73c\ub85c \uc0dd\uc131",
      "\ud504\ub85c\uc81d\ud2b8 \ub85c\uadf8\ub294 update.recent \uc2a4\ud0ac\ub85c \uc790\ub3d9 \uc218\uc9d1",
      "\uc2a4\ud0ac \ub3d9\uae30\ud654\ub294 sync-skills.mjs\ub85c DB\uc5d0 upsert"
    ],
    sections: [
      {
        title: "\ud559\uc2b5 \uc2dc\uc2a4\ud15c",
        type: "spec", layout: "cards",
        key_message: "docx/\ud14d\uc2a4\ud2b8 \uc785\ub825 \u2192 AI \uc2ac\ub77c\uc774\ub4dc \ubcc0\ud658 \u2192 \ub77c\uc774\ube0c\ub7ec\ub9ac \uc800\uc7a5",
        content: "",
        points: [
          { term: "\uc5c5\ub85c\ub4dc (/study)", explanation: "Word \ud30c\uc77c \ub4dc\ub798\uadf8\uc564\ub4dc\ub86d \ub610\ub294 \ud14d\uc2a4\ud2b8 \uc9c1\uc811 \uc785\ub825. mammoth\uc73c\ub85c docx \ud30c\uc2f1 \ud6c4 Anthropic API\ub85c \uad6c\uc870\ud654\ub41c \uc2ac\ub77c\uc774\ub4dc JSON \uc0dd\uc131.", priority: "must" },
          { term: "\ub77c\uc774\ube0c\ub7ec\ub9ac (/library)", explanation: "\uc800\uc7a5\ub41c \ub9ac\ud3ec\ud2b8 \ubaa9\ub85d. \ud0dc\uadf8 \ud544\ud130\ub9c1, \uac80\uc0c9, PDF \ub2e4\uc6b4\ub85c\ub4dc, AI \uc7ac\uc0dd\uc131 \uae30\ub2a5.", priority: "must" },
          { term: "logic.summary \uc2a4\ud0ac", explanation: "\ud559\uc2b5 \ub178\ud2b8\ub97c \uc2ac\ub77c\uc774\ub4dc \ud3ec\ub9f7\uc73c\ub85c \uad6c\uc870\ud654\ud558\ub294 AI \ud504\ub86c\ud504\ud2b8 \uc2a4\ud0ac.", priority: "must" }
        ]
      },
      {
        title: "\ud504\ub85c\uc81d\ud2b8 \uad00\ub9ac",
        type: "spec", layout: "cards",
        key_message: "\ud504\ub85c\uc81d\ud2b8\ubcc4 \ud0c0\uc784\ub77c\uc778 \ub85c\uadf8 + \uae30\ud68d \ucd08\uc548 \ubb38\uc11c \uad00\ub9ac",
        content: "",
        points: [
          { term: "\ud504\ub85c\uc81d\ud2b8 CRUD", explanation: "\uc774\ub984, \uc124\uba85, \ucee8\ub7ec, \uc0c1\ud0dc \uad00\ub9ac. soft delete\ub85c 24\uc2dc\uac04 \ubcf5\uc6d0 \uac00\ub2a5.", priority: "must" },
          { term: "\uc5c5\ub370\uc774\ud2b8 \ud604\ud669", explanation: "update.recent \uc2a4\ud0ac\ub85c Claude Code \uc138\uc158 \ubcc0\uacbd\ubd84\uc744 \uc790\ub3d9 \uc694\uc57d\ud558\uc5ec \ub0a0\uc9dc\ubcc4 \ud0c0\uc784\ub77c\uc778 \ud45c\uc2dc.", priority: "must" },
          { term: "\uae30\ud68d \ucd08\uc548", explanation: "4\uac1c phase\ubcc4 \uae30\ud68d \ubb38\uc11c. project-kickoff \uc2a4\ud0ac\ub85c Q&A \ud6c4 \uc790\ub3d9 \uc0dd\uc131 \ub610\ub294 \uc218\uae30 \uc785\ub825.", priority: "should" }
        ]
      },
      {
        title: "\uc6b0\uc120\uc21c\uc704 \ub9e4\ud2b8\ub9ad\uc2a4",
        type: "priority", layout: "table",
        key_message: "\ud575\uc2ec \uae30\ub2a5\uc740 \ubaa8\ub450 \uad6c\ud604 \uc644\ub8cc",
        content: "| \uc6b0\uc120\uc21c\uc704 | \uae30\ub2a5 | \uc0c1\ud0dc |\n|---|---|---|\n| \ud83d\udd34 Must | \ud559\uc2b5 \uc5c5\ub85c\ub4dc + AI \uc694\uc57d | \u2705 |\n| \ud83d\udd34 Must | \ud504\ub85c\uc81d\ud2b8 \uad00\ub9ac + \ub85c\uadf8 | \u2705 |\n| \ud83d\udd34 Must | Google OAuth \uc778\uc99d | \u2705 |\n| \ud83d\udd34 Must | update.recent \uc138\uc158 \uc790\ub3d9 \uc5c5\ub85c\ub4dc | \u2705 |\n| \ud83d\udfe1 Should | \uae30\ud68d \ucd08\uc548 \uc2dc\uc2a4\ud15c | \u2705 |\n| \ud83d\udfe1 Should | \uc2a4\ud0ac \uc790\ub3d9 \ub3d9\uae30\ud654 | \u2705 |\n| \ud83d\udfe2 Could | PDF \ub2e4\uc6b4\ub85c\ub4dc | \u2705 |\n| \ud83d\udfe2 Could | \uc8fc\uac04 \ubaa9\ud45c \ub300\uc2dc\ubcf4\ub4dc | \u2705 |",
        points: []
      }
    ],
    dev_notes: { claude_prompt_hint: "\uae30\ub2a5 \ucd94\uac00 \uc2dc \uae30\uc874 API \ud328\ud134 \uc900\uc218.", dependencies: [], risks: [] },
    tags: ["\uae30\ub2a5\ucd94\uac00"]
  },
  {
    project_id: PID, doc_type: "screen_structure", phase: "screen",
    title: "Personal Management \u2014 \ud654\uba74 \uad6c\uc870",
    summary: "6\uac1c \ud398\uc774\uc9c0 + \ubaa8\ub2ec \uae30\ubc18 \ud3b8\uc9d1. Navbar \uace0\uc815 \uc0c1\ub2e8, \uc0ac\uc774\ub4dc\ubc14+\uba54\uc778 2\ucee8\ub7fc \ub808\uc774\uc544\uc6c3.",
    key_decisions: [
      "\ud504\ub85c\uc81d\ud2b8 \ud398\uc774\uc9c0\ub294 3\ucee8\ub7fc \uad6c\uc870",
      "\ubaa8\ubc14\uc77c\uc740 \uc0ac\uc774\ub4dc\ubc14/\uba54\uc778 \uc804\ud658 \ubc29\uc2dd",
      "\ubaa8\ub4e0 \ud3b8\uc9d1\uc740 \ubaa8\ub2ec \ub2e4\uc774\uc5bc\ub85c\uadf8\ub85c \ucc98\ub9ac"
    ],
    sections: [
      {
        title: "\ud398\uc774\uc9c0 \ub9f5",
        type: "wireframe", layout: "steps",
        key_message: "6\uac1c \ud398\uc774\uc9c0, Navbar\uc5d0\uc11c \uc9c1\uc811 \uc774\ub3d9",
        content: "1. **/** \u2014 \ud648 \ub300\uc2dc\ubcf4\ub4dc: \ucd5c\uadfc \ud504\ub85c\uc81d\ud2b8\u00b7\ud559\uc2b5\u00b7\ub85c\uadf8\u00b7\uc2a4\ud0ac \uce74\ub4dc \uc694\uc57d\n2. **/study** \u2014 \ud559\uc2b5 \uc5c5\ub85c\ub4dc: \ub4dc\ub798\uadf8\uc564\ub4dc\ub86d \uc601\uc5ed + AI \uc2ac\ub77c\uc774\ub4dc \ud504\ub9ac\ubdf0\n3. **/library** \u2014 \ub77c\uc774\ube0c\ub7ec\ub9ac: \uac80\uc0c9\ubc14 + \ub9ac\ud3ec\ud2b8 \uce74\ub4dc \uadf8\ub9ac\ub4dc + \uc0c1\uc138 \uc0ac\uc774\ub4dc\ud328\ub110\n4. **/projects** \u2014 \ud504\ub85c\uc81d\ud2b8: \uc0ac\uc774\ub4dc\ubc14(\ubaa9\ub85d) + \uae30\ud68d\ucd08\uc548(\uc88c) + \uc5c5\ub370\uc774\ud2b8\ud604\ud669(\uc6b0)\n5. **/goals** \u2014 \uc9c4\ud589 \ub300\uc2dc\ubcf4\ub4dc: 7\uc77c \uce98\ub9b0\ub354 \ubdf0 + \ubaa9\ud45c\ubcc4 \uc9c4\ud589\ub960 \ubc14\n6. **/skills** \u2014 \uc2a4\ud0ac: \uce74\ub4dc \uadf8\ub9ac\ub4dc + \uc0c1\uc138 \ud1a0\uae00",
        points: []
      },
      {
        title: "\ud504\ub85c\uc81d\ud2b8 \ud398\uc774\uc9c0 \ub808\uc774\uc544\uc6c3",
        type: "wireframe", layout: "cards",
        key_message: "3\ucee8\ub7fc: \ud504\ub85c\uc81d\ud2b8 \uc0ac\uc774\ub4dc\ubc14 | \uae30\ud68d \ucd08\uc548 | \uc5c5\ub370\uc774\ud2b8 \ud604\ud669",
        content: "",
        points: [
          { term: "\uc0ac\uc774\ub4dc\ubc14 (w-72)", explanation: "\ud504\ub85c\uc81d\ud2b8 \ubaa9\ub85d, +\ubc84\ud2bc\uc73c\ub85c \uc0dd\uc131, \ud638\ubc84 \uc2dc \ud3b8\uc9d1/\uc0ad\uc81c. \uc0ad\uc81c\ub41c \ud504\ub85c\uc81d\ud2b8\ub294 \ubc18\ud22c\uba85+\ubcf5\uc6d0 \ubc84\ud2bc." },
          { term: "\uae30\ud68d \ucd08\uc548 (\uc88c 1/2)", explanation: "4\uac1c doc_type \ud0ed. sections\ub97c \uc2ac\ub77c\uc774\ub4dc \uce74\ub4dc\ub85c \ub80c\ub354\ub9c1. \uace0\uc815 \ud328\ub110." },
          { term: "\uc5c5\ub370\uc774\ud2b8 \ud604\ud669 (\uc6b0 1/2)", explanation: "\ub0a0\uc9dc\ubcc4 \uadf8\ub8f9\ud551\ub41c \ud0c0\uc784\ub77c\uc778. \ub3c5\ub9bd \uc2a4\ud06c\ub864." }
        ]
      },
      {
        title: "\uc0ac\uc6a9\uc790 \ud50c\ub85c\uc6b0",
        type: "flow", layout: "table",
        key_message: "\uc8fc\uc694 \uacbd\ub85c: \ud648\u2192\ud504\ub85c\uc81d\ud2b8 / \ud648\u2192\uc5c5\ub85c\ub4dc\u2192\ub77c\uc774\ube0c\ub7ec\ub9ac",
        content: "| From | Action | To |\n|---|---|---|\n| \ud648 (/) | \ud504\ub85c\uc81d\ud2b8 \uce74\ub4dc \ud074\ub9ad | /projects |\n| \ud648 (/) | \ucd5c\uadfc \ud559\uc2b5 \ud074\ub9ad | /library |\n| /study | AI \uc694\uc57d \uc0dd\uc131 \u2192 \uc800\uc7a5 | /library |\n| /projects | \uc0ac\uc774\ub4dc\ubc14 \ud074\ub9ad | \uc6b0\uce21 \ud328\ub110\uc5d0 \ub85c\uadf8+\uae30\ud68d \ud45c\uc2dc |\n| /projects | \uae30\ud68d \ucd08\uc548 \ud0ed \ud074\ub9ad | \ud574\ub2f9 doc_type \ubb38\uc11c \ud45c\uc2dc |\n| /projects | \u270f\ufe0f \ubc84\ud2bc | \uc218\uae30 \uc785\ub825 \ubaa8\ub2ec |",
        points: []
      }
    ],
    dev_notes: { claude_prompt_hint: "\ud504\ub85c\uc81d\ud2b8 \ud398\uc774\uc9c0\ub294 flex \uae30\ubc18 3\ucee8\ub7fc. \ub192\uc774\ub294 h-[calc(100vh-4rem)]\ub85c \uace0\uc815.", dependencies: [], risks: [] },
    tags: ["\uae30\ub2a5\ucd94\uac00"]
  },
  {
    project_id: PID, doc_type: "design_spec", phase: "design",
    title: "Personal Management \u2014 \ub514\uc790\uc778 \uba85\uc138",
    summary: "Inter \ud3f0\ud2b8 + Indigo \uacc4\uc5f4 brand \ucee8\ub7ec. \uae00\ub798\uc2a4\ubaa8\ud53c\uc998 \uce74\ub4dc, \ubbf8\ub2c8\uba40 \ubaa8\ub358 \ud1a4.",
    key_decisions: [
      "Inter \ud3f0\ud2b8 (300~800 weight)",
      "brand-500(#6366f1, Indigo) \uae30\uc900 \ucee8\ub7ec \uc2dc\uc2a4\ud15c",
      "\ubbf8\ub2c8\uba40 \ubaa8\ub358 + \uae00\ub798\uc2a4\ubaa8\ud53c\uc998 \uce74\ub4dc \ub514\uc790\uc778"
    ],
    sections: [
      {
        title: "\ucee8\ub7ec \ud314\ub808\ud2b8",
        type: "style", layout: "table",
        key_message: "Indigo \uae30\ubc18 brand \ucee8\ub7ec + \uc0c1\ud0dc\ubcc4 \uc2dc\ub9e8\ud2f1 \ucee8\ub7ec",
        content: "| \uc6a9\ub3c4 | \ucee8\ub7ec | \ucf54\ub4dc |\n|---|---|---|\n| Brand Primary | Indigo | #6366f1 |\n| Brand Dark | Deep Indigo | #4338ca |\n| Accent | Purple | #8b5cf6 |\n| Success | Emerald | #10b981 |\n| Warning | Amber | #f59e0b |\n| Error | Red | #ef4444 |\n| Info | Cyan | #06b6d4 |\n| Neutral | Slate | #64748b |",
        points: []
      },
      {
        title: "\ubb34\ub4dc & \ud1a4\uc564\ub9e4\ub108",
        type: "style", layout: "definition",
        key_message: "\ubbf8\ub2c8\uba40, \uc804\ubb38\uc801, \uae54\ub054\ud55c \uac1c\uc778 \ub300\uc2dc\ubcf4\ub4dc",
        content: "",
        points: [
          { term: "\ubb34\ub4dc \ud0a4\uc6cc\ub4dc", explanation: "\ubbf8\ub2c8\uba40, \uc804\ubb38\uc801, \uae54\ub054, \uc2e0\ub8b0\uac10, \ubaa8\ub358" },
          { term: "\ud3f0\ud2b8", explanation: "Inter (Google Fonts). 300~800 weight. \ud55c\uad6d\uc5b4 \ubcf8\ubb38\uc5d0\ub3c4 Inter \uc0ac\uc6a9." },
          { term: "\uce74\ub4dc \uc2a4\ud0c0\uc77c", explanation: "rounded-2xl, shadow-sm, bg-white. \ud638\ubc84 \uc2dc shadow-md. \uae00\ub798\uc2a4\ubaa8\ud53c\uc998: white/70 + backdrop-blur." },
          { term: "\uc560\ub2c8\uba54\uc774\uc158", explanation: "fade-in(0.3s), slide-up(0.4s). \ubbf8\ubb18\ud55c \uc804\ud658\ub9cc." },
          { term: "\ubc18\uc751\ud615", explanation: "sm(640) / md(768) / lg(1024). \ubaa8\ubc14\uc77c \uc6b0\uc120." }
        ]
      }
    ],
    dev_notes: { claude_prompt_hint: "Tailwind \ucee4\uc2a4\ud140 \ucee8\ub7ec\ub294 tailwind.config.ts\uc758 brand \ud0a4.", dependencies: [], risks: [] },
    tags: ["\uae30\ub2a5\ucd94\uac00"]
  }
];

async function main() {
  for (const doc of docs) {
    const res = await fetch(`${SB_URL}/rest/v1/planning_docs`, {
      method: "POST",
      headers: { ...HEADERS, Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(doc),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(doc.doc_type, "OK:", data[0]?.id);
    } else {
      console.error(doc.doc_type, "FAIL:", res.status, await res.text());
    }
  }
}
main();
