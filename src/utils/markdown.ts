import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { Root, Heading, List, ListItem, Paragraph, Text, Content, Strong, Emphasis, InlineCode, Link, Break } from 'mdast';
import type { Basics, ContributionGroup, Education, Experience, Project, Resume } from '../types/resume';

// {{CHENGQI:
// Action: Added; Timestamp: 2026-01-04 14:50:00 +08:00; Reason: Task #25471ab4, 创建灵活的section识别机制;
// }}
// {{START MODIFICATIONS}}
// Section type identifiers (internal use)
const SECTION_TYPE_CORE = '__CORE_ABILITIES__';
const SECTION_TYPE_WORK = '__WORK_EXPERIENCE__';
const SECTION_TYPE_EDU = '__EDUCATION__';

/**
 * 识别section标题类型，支持多种标题变体
 * @param title - section标题文本
 * @returns section类型标识符，如果无法识别则返回null
 */
const identifySectionType = (title: string): string | null => {
  const normalized = title.trim().replace(/\s+/g, '');
  
  // 核心能力/技能变体识别
  if (/^(核心能力|技能|专业技能|技术能力|核心竞争力|技术栈|个人优势|个人亮点)$/.test(normalized)) {
    return SECTION_TYPE_CORE;
  }
  
  // 工作经历变体识别
  if (/^(工作经历|工作经验|项目经验|工作履历|项目经历)$/.test(normalized)) {
    return SECTION_TYPE_WORK;
  }
  
  // 教育经历变体识别
  if (/^(教育经历|教育背景)$/.test(normalized)) {
    return SECTION_TYPE_EDU;
  }
  
  return null;
};
// {{END MODIFICATIONS}}

// Legacy constants for backward compatibility (used in resumeToMarkdown)
const SECTION_CORE = '核心能力';
const SECTION_WORK = '工作经历';
const SECTION_EDU = '教育经历';

const processor = unified().use(remarkParse);

const stringifyProcessor = unified().use(remarkParse).use(remarkStringify, {
  bullet: '-',
  rule: '-',
  listItemIndent: 'one',
  fences: true,
  emphasis: '*'
});

const normalizeText = (node: Content): string => {
  if (node.type === 'text') return (node as Text).value;
  if (node.type === 'strong') {
    const inner = (node as Strong).children.map(normalizeText).join('');
    return `**${inner}**`;
  }
  if (node.type === 'emphasis') {
    const inner = (node as Emphasis).children.map(normalizeText).join('');
    return `*${inner}*`;
  }
  if (node.type === 'inlineCode') {
    return `\`${(node as InlineCode).value}\``;
  }
  if (node.type === 'link') {
    const link = node as Link;
    const text = link.children.map(normalizeText).join('');
    return link.url ? `[${text}](${link.url})` : text;
  }
  if (node.type === 'break') {
    return '\n';
  }
  if ('children' in node) {
    return (node.children as Content[]).map(normalizeText).join('').trim();
  }
  return '';
};

const KEY_RESPONSIBILITY = 'responsibility';
const KEY_SUMMARY = 'summary';
const KEY_STACK = 'stack';
const KEY_CONTRIBUTIONS = 'contributions';

const extractKeyAndMaybeValue = (text: string): { key: string; value: string } | { key: string; value?: undefined } | null => {
  // 支持英文/中文冒号；允许空 value（例如 `contributions:`）
  const match = text.match(/^([^:：]+)[:：]\s*(.*)$/);
  if (!match) return null;
  const rawKey = match[1].trim();
  const rawValue = match[2] ?? '';
  const value = rawValue.trim();
  const key = rawKey.toLowerCase().replace(/[*_`]/g, '').trim();
  if (!key) return null;
  if (!value) return { key };
  return { key, value };
};

const parseExperienceHeading = (heading: Heading): Experience => {
  const title = heading.children.map(normalizeText).join(' ');
  const [position = '', company = '', duration = ''] = title.split(/[|｜]/).map((s) => s.trim());
  const [start = '', end = ''] = duration.split(/[-–—]/).map((s) => s.trim());
  return {
    company,
    position,
    start,
    end: end || '至今',
    projects: []
  };
};

const parseProjectHeading = (heading: Heading): Project => ({
  name: heading.children.map(normalizeText).join(' '),
  contributions: []
});

const listItemText = (item: ListItem): string =>
  item.children
    .filter((child) => child.type === 'paragraph')
    .map((child) => normalizeText(child as Paragraph))
    .join(' ');

const extractNestedListItems = (item: ListItem): string[] => {
  const nestedList = item.children.find((child) => child.type === 'list') as List | undefined;
  if (!nestedList) return [];
  return nestedList.children.map((child) => listItemText(child as ListItem)).filter(Boolean);
};

const extractKeyValue = (text: string): { key: string; value: string } | null => {
  // 支持英文/中文冒号；同时允许 value 内出现冒号
  const match = text.match(/^([^:：]+)[:：]\s*(.+)$/);
  if (!match) return null;
  const rawKey = match[1].trim();
  const value = match[2].trim();
  // 允许用户误把 key 加粗/加 code（例如 **responsibility**:），这里做一次兜底
  const key = rawKey.toLowerCase().replace(/[*_`]/g, '').trim();
  if (!key || !value) return null;
  return { key, value };
};

const parseContributionGroup = (item: ListItem): ContributionGroup | null => {
  const title = listItemText(item);
  const nested = extractNestedListItems(item);
  if (!title && !nested.length) return null;
  return { title: title || '贡献', items: nested.length ? nested : [title] };
};

const stringifyMdastNodes = (nodes: Content[]): string => {
  const root: Root = { type: 'root', children: nodes };
  return unified()
    .use(remarkStringify, {
      bullet: '-',
      rule: '-',
      listItemIndent: 'one',
      fences: true,
      emphasis: '*'
    })
    .stringify(root)
    .trim();
};

export const parseMarkdown = (markdown: string): Resume => {
  // Normalize tabs to spaces to avoid markdown parser treating nested lists as code blocks
  // (common when users paste content with \t indentation)
  const normalizedInput = markdown.replace(/\t/g, '  ');
  const lines = normalizedInput.split(/\r?\n/);
  let cursor = 0;

  const frontMatter: Record<string, string> = {};
  if (lines[cursor]?.trim() === '---') {
    cursor += 1;
    while (cursor < lines.length && lines[cursor].trim() !== '---') {
      const line = lines[cursor];
      const [rawKey, ...rest] = line.split(':');
      if (rawKey && rest.length) {
        frontMatter[rawKey.trim().toLowerCase()] = rest.join(':').trim();
      }
      cursor += 1;
    }
    // skip trailing ---
    if (lines[cursor]?.trim() === '---') cursor += 1;
  }

  // Extra: make `contributions:` blocks more forgiving by indenting subsequent lines into the list item
  // when the author forgot to indent them (so they still belong to contributions).
  const normalizeContributionsIndent = (raw: string): string => {
    const lns = raw.split(/\r?\n/);
    const out: string[] = [];
    for (let i = 0; i < lns.length; i += 1) {
      const line = lns[i];
      out.push(line);
      const m = line.match(/^(\s*)-\s*contributions\s*[:：].*$/i);
      if (!m) continue;
      const baseIndent = m[1] ?? '';
      const targetIndent = `${baseIndent}  `;
      for (let j = i + 1; j < lns.length; j += 1) {
        const next = lns[j];
        if (!next.trim()) {
          continue;
        }
        // Stop when we hit a new peer list item (same indent) or a new heading
        if (next.startsWith(baseIndent) && next.match(new RegExp(`^${baseIndent}-\\s+`))) break;
        if (next.match(/^#{2,4}\s+/)) break;
        if (next.startsWith(targetIndent)) continue;
        // If line is at the same indent level, indent it into the contributions list item
        if (next.startsWith(baseIndent)) {
          lns[j] = `${targetIndent}${next.slice(baseIndent.length)}`;
        }
      }
    }
    return lns.join('\n');
  };

  const tree = processor.parse(normalizeContributionsIndent(lines.slice(cursor).join('\n'))) as Root;
  const resume: Resume = {
    basics: { name: '', contact: {} },
    coreAbilities: [],
    experiences: [],
    education: []
  };

  let currentSection = '';
  let currentExperience: Experience | null = null;
  let currentProject: Project | null = null;

  const flushExperience = () => {
    if (currentExperience) {
      if (currentProject) {
        currentExperience.projects.push(currentProject);
        currentProject = null;
      }
      resume.experiences.push(currentExperience);
      currentExperience = null;
    }
  };

  tree.children.forEach((node) => {
    if (node.type === 'heading') {
      const heading = node as Heading;
      if (heading.depth === 1) {
        resume.basics.name = heading.children.map(normalizeText).join(' ').trim();
      } else if (heading.depth === 2) {
        // {{CHENGQI:
        // Action: Modified; Timestamp: 2026-01-04 14:51:00 +08:00; Reason: Task #25471ab4, 使用灵活的section识别;
        // }}
        // {{START MODIFICATIONS}}
        const headingText = heading.children.map(normalizeText).join(' ').trim();
        const sectionType = identifySectionType(headingText);
        if (sectionType) {
          currentSection = sectionType;
        } else {
          currentSection = headingText; // fallback to original text
        }
        if (currentSection !== SECTION_TYPE_WORK) {
          flushExperience();
        }
        // {{END MODIFICATIONS}}
      } else if (heading.depth === 3 && currentSection === SECTION_TYPE_WORK) {
        if (currentProject) {
          currentExperience?.projects.push(currentProject);
          currentProject = null;
        }
        if (currentExperience) {
          resume.experiences.push(currentExperience);
        }
        currentExperience = parseExperienceHeading(heading);
      } else if (heading.depth === 4 && currentSection === SECTION_TYPE_WORK) {
        if (currentProject) {
          currentExperience?.projects.push(currentProject);
        }
        currentProject = parseProjectHeading(heading);
      }
      return;
    }

    // {{CHENGQI:
    // Action: Modified; Timestamp: 2026-01-04 14:52:00 +08:00; Reason: Task #25471ab4, 更新section类型比较;
    // }}
    // {{START MODIFICATIONS}}
    if (node.type === 'list' && currentSection === SECTION_TYPE_CORE) {
      const list = node as List;
      list.children.forEach((item) => {
        const text = listItemText(item as ListItem);
        if (text) resume.coreAbilities.push(text);
      });
    }

    if (node.type === 'list' && currentSection === SECTION_TYPE_EDU) {
    // {{END MODIFICATIONS}}
      const list = node as List;
      list.children.forEach((item) => {
        const parts = listItemText(item as ListItem).split(/[|｜]/).map((s) => s.trim());
        const [school = '', major = '', degree = '', graduationRaw = ''] = parts;
        const graduation = graduationRaw?.replace(/^毕业[：:]\s*/, '').trim();
        const education: Education = {
          school,
          major,
          degree,
          graduation: graduation || undefined
        };
        resume.education.push(education);
      });
    }

    if (currentSection === SECTION_TYPE_WORK && currentExperience) {
      if (node.type === 'list' && !currentProject) {
        const list = node as List;
        list.children.forEach((item) => {
          const kv = extractKeyValue(listItemText(item as ListItem));
          if (kv?.key === KEY_RESPONSIBILITY) {
            currentExperience.responsibilities = kv.value;
          }
        });
      }

      if (node.type === 'list' && currentProject) {
        const list = node as List;
        // Support both:
        // 1) legacy nested groups under `contributions:`
        // 2) free-form markdown blocks (bold titles + lists), even if author uses tabs / forgets indentation
        for (let idx = 0; idx < list.children.length; idx += 1) {
          const item = list.children[idx] as ListItem;
          const text = listItemText(item);
          const kv = extractKeyValue(text);
          const keyOnly = extractKeyAndMaybeValue(text);
          const nested = extractNestedListItems(item);

          if (kv?.key === KEY_SUMMARY) {
            currentProject.description = kv.value;
            continue;
          }
          if (kv?.key === KEY_STACK) {
            currentProject.techStack = kv.value;
            continue;
          }

          const isContributions = kv?.key === KEY_CONTRIBUTIONS || keyOnly?.key === KEY_CONTRIBUTIONS;
          if (isContributions) {
            const li = item;
            const children = (li.children || []) as Content[];
            const nestedList = children.find((child) => child.type === 'list') as List | undefined;

            // Heuristic: if it's exactly the legacy nested-list groups format, keep old parsing for nicer layout
            const looksLikeLegacyGroups =
              !!nestedList &&
              nestedList.children.length > 0 &&
              nestedList.children.every((c) => (c as ListItem).children?.some((cc) => (cc as Content).type === 'list'));

            if (looksLikeLegacyGroups && nestedList) {
              nestedList.children.forEach((nestedItem) => {
                const group = parseContributionGroup(nestedItem as ListItem);
                if (group) currentProject.contributions.push(group);
              });
              continue;
            }

            // Build markdown without the literal `contributions:` prefix.
            const parts: string[] = [];
            if (kv?.value) parts.push(kv.value);

            // Include nested list / other child nodes, excluding the key paragraph.
            const contentNodes = children.filter((child) => {
              if (child.type !== 'paragraph') return true;
              const pText = normalizeText(child as Paragraph).toLowerCase().replace(/[*_`]/g, '').trim();
              // remove both `contributions:` and `contributions: xxx`
              return !(pText === `${KEY_CONTRIBUTIONS}:` || pText.startsWith(`${KEY_CONTRIBUTIONS}:`));
            });
            if (contentNodes.length) parts.push(stringifyMdastNodes(contentNodes));

            // Also accept subsequent list items (same list) as part of contributions until next key-value item.
            // This supports authors writing:
            // - contributions: **A**
            //   - ...
            // - **B**
            //   - ...
            for (let j = idx + 1; j < list.children.length; j += 1) {
              const nextItem = list.children[j] as ListItem;
              const nextText = listItemText(nextItem);
              const nextKv = extractKeyAndMaybeValue(nextText);
              if (nextKv?.key === KEY_SUMMARY || nextKv?.key === KEY_STACK || nextKv?.key === KEY_CONTRIBUTIONS) break;

              const nextChildren = (nextItem.children || []) as Content[];
              const nextNestedList = nextChildren.find((c) => c.type === 'list') as List | undefined;
              const title = nextText.trim();
              if (title) parts.push(title);
              if (nextNestedList) parts.push(stringifyMdastNodes([nextNestedList]));
              idx = j; // skip consumed items in the outer loop
            }

            const md = parts
              .map((p) => p.trim())
              .filter(Boolean)
              .join('\n\n')
              .trim();

            if (md) currentProject.contributionsMarkdown = md;
            continue;
          }

          if (nested.length) {
            currentProject.contributions.push({ title: text, items: nested });
          }
        }
      }
    }
  });

  flushExperience();
  if (Object.keys(frontMatter).length) {
    const fm = frontMatter;
    const fmBasics: Basics = {
      name: fm.name || resume.basics.name,
      gender: fm.gender || resume.basics.gender,
      yearsOfExperience: fm.yearsexp || resume.basics.yearsOfExperience,
      title: fm.title || resume.basics.title,
      contact: {
        phone: fm.phone || resume.basics.contact?.phone,
        email: fm.email || resume.basics.contact?.email,
        wechat: fm.wechat || resume.basics.contact?.wechat,
        city: fm.location || resume.basics.contact?.city
      },
      location: fm.location || resume.basics.location,
      github: fm.github || resume.basics.github,
      website: fm.website || resume.basics.website,
      degree: fm.education_degree || resume.basics.degree,
      school: fm.education_school || resume.basics.school,
      major: fm.education_major || resume.basics.major,
      graduation: fm.education_gradyear || resume.basics.graduation
    };
    resume.basics = { ...resume.basics, ...fmBasics, contact: { ...resume.basics.contact, ...fmBasics.contact } };

    if (fm.education_school || fm.education_major || fm.education_degree) {
      const edu: Education = {
        school: fm.education_school || '',
        major: fm.education_major || '',
        degree: fm.education_degree || '',
        graduation: fm.education_gradyear
      };
      if (!resume.education.length) {
        resume.education.push(edu);
      } else {
        resume.education[0] = { ...edu, ...resume.education[0] };
      }
    }
  }
  return resume;
};

export const resumeToMarkdown = (resume: Resume): string => {
  const lines: string[] = [];
  const fm: string[] = [];

  if (resume.basics.name || resume.basics.contact?.email || resume.basics.school) {
    fm.push('---');
    if (resume.basics.name) fm.push(`name: ${resume.basics.name}`);
    if (resume.basics.gender) fm.push(`gender: ${resume.basics.gender}`);
    if (resume.basics.yearsOfExperience) fm.push(`yearsExp: ${resume.basics.yearsOfExperience}`);
    if (resume.basics.title) fm.push(`title: ${resume.basics.title}`);
    if (resume.basics.contact?.phone) fm.push(`phone: ${resume.basics.contact.phone}`);
    if (resume.basics.contact?.email) fm.push(`email: ${resume.basics.contact.email}`);
    if (resume.basics.contact?.wechat) fm.push(`wechat: ${resume.basics.contact.wechat}`);
    if (resume.basics.location || resume.basics.contact?.city) fm.push(`location: ${resume.basics.location || resume.basics.contact?.city}`);
    if (resume.basics.github) fm.push(`github: ${resume.basics.github}`);
    if (resume.basics.website) fm.push(`website: ${resume.basics.website}`);
    if (resume.basics.school) fm.push(`education_school: ${resume.basics.school}`);
    if (resume.basics.major) fm.push(`education_major: ${resume.basics.major}`);
    if (resume.basics.degree) fm.push(`education_degree: ${resume.basics.degree}`);
    if (resume.basics.graduation) fm.push(`education_gradYear: ${resume.basics.graduation}`);
    fm.push('---', '');
  }
  lines.push(`# ${resume.basics.name || '姓名'}`);
  lines.push('', `## ${SECTION_CORE}`);
  resume.coreAbilities.forEach((ability) => {
    lines.push(`- ${ability}`);
  });

  lines.push('', `## ${SECTION_WORK}`, '');
  resume.experiences.forEach((exp) => {
    lines.push(`### ${exp.position} ｜ ${exp.company} ｜ ${exp.start}–${exp.end}`);
    if (exp.responsibilities) {
      lines.push(`- ${KEY_RESPONSIBILITY}: ${exp.responsibilities}`);
    }
    exp.projects.forEach((project) => {
      lines.push('', `#### ${project.name}`);
      if (project.description) lines.push(`- ${KEY_SUMMARY}: ${project.description}`);
      if (project.techStack) lines.push(`- ${KEY_STACK}: ${project.techStack}`);
      if (project.contributionsMarkdown?.trim()) {
        lines.push(`- ${KEY_CONTRIBUTIONS}:`);
        // indent the block under contributions
        const md = project.contributionsMarkdown.trim().split('\n');
        md.forEach((line) => lines.push(`  ${line}`));
      } else if (project.contributions.length) {
        lines.push(`- ${KEY_CONTRIBUTIONS}:`);
        project.contributions.forEach((group) => {
          const titleLine = group.title && group.title !== '贡献' ? `  - ${group.title}` : '  -';
          lines.push(titleLine);
          group.items.forEach((item) => lines.push(`    - ${item}`));
        });
      }
    });
    lines.push('');
  });

  lines.push(`## ${SECTION_EDU}`);
  resume.education.forEach((edu) => {
    const eduLine = [
      edu.school,
      edu.major,
      edu.degree,
      edu.graduation ? `毕业：${edu.graduation}` : ''
    ]
      .filter(Boolean)
      .join(' ｜ ');
    lines.push(`- ${eduLine}`);
  });

  const root = stringifyProcessor.parse(lines.join('\n')) as Root;
  return stringifyProcessor.stringify(root);
};
