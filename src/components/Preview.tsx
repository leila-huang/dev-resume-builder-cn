import { Fragment, useMemo, useRef } from 'react';
import { usePagination } from '../hooks/usePagination';
import type { Resume, TypographySettings } from '../types/resume';

interface PreviewProps {
  resume: Resume;
  settings: TypographySettings;
}

const renderInlineMd = (text: string) => {
  // Minimal inline markdown: **bold**, *italic*, `code`
  // Designed to respect author's intent and keep ATS-friendly tags (<strong>/<em>/<code>).
  const nodes: React.ReactNode[] = [];
  let rest = text;

  const pushText = (t: string) => {
    if (t) nodes.push(t);
  };

  // First, handle code spans: `...`
  while (rest.includes('`')) {
    const start = rest.indexOf('`');
    const end = rest.indexOf('`', start + 1);
    if (end === -1) break;
    pushText(rest.slice(0, start));
    nodes.push(
      <code key={`code-${nodes.length}`} style={{ fontFamily: 'inherit' }}>
        {rest.slice(start + 1, end)}
      </code>
    );
    rest = rest.slice(end + 1);
  }
  pushText(rest);

  // Then, split bold/italic inside each string chunk.
  const finalNodes: React.ReactNode[] = [];
  nodes.forEach((node, idx) => {
    if (typeof node !== 'string') {
      finalNodes.push(node);
      return;
    }
    let s = node;
    while (s.length) {
      const boldStart = s.indexOf('**');
      const italicStart = s.indexOf('*');
      const nextBold = boldStart === -1 ? Number.POSITIVE_INFINITY : boldStart;
      const nextItalic = italicStart === -1 ? Number.POSITIVE_INFINITY : italicStart;
      const next = Math.min(nextBold, nextItalic);
      if (next === Number.POSITIVE_INFINITY) {
        finalNodes.push(s);
        break;
      }
      if (next > 0) {
        finalNodes.push(s.slice(0, next));
        s = s.slice(next);
        continue;
      }
      if (s.startsWith('**')) {
        const end = s.indexOf('**', 2);
        if (end === -1) {
          finalNodes.push(s);
          break;
        }
        const inner = s.slice(2, end);
        finalNodes.push(
          <strong key={`strong-${idx}-${finalNodes.length}`} style={{ fontWeight: 700 }}>
            {inner}
          </strong>
        );
        s = s.slice(end + 2);
        continue;
      }
      if (s.startsWith('*')) {
        // avoid treating ** as italic
        if (s.startsWith('**')) continue;
        const end = s.indexOf('*', 1);
        if (end === -1) {
          finalNodes.push(s);
          break;
        }
        const inner = s.slice(1, end);
        finalNodes.push(
          <em key={`em-${idx}-${finalNodes.length}`} style={{ fontStyle: 'italic' }}>
            {inner}
          </em>
        );
        s = s.slice(end + 1);
        continue;
      }
      finalNodes.push(s);
      break;
    }
  });

  return finalNodes.length ? <>{finalNodes.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</> : text;
};

const Preview = ({ resume, settings }: PreviewProps) => {
  const flowRef = useRef<HTMLDivElement>(null);
  const { breakIndices } = usePagination(flowRef, [resume, settings]);

  const typographyStyle = useMemo(
    () => ({
      fontFamily: settings.fontFamily,
      lineHeight: settings.lineHeight
    }),
    [settings.fontFamily, settings.lineHeight]
  );

  const contentBlocks = useMemo(() => {
    const blocks: React.ReactNode[] = [];

    // Basics block
    const headerRightMetaItems = [
      resume.basics.gender,
      resume.basics.yearsOfExperience
    ].filter(Boolean);

    const contactItems = [
      resume.basics.contact?.phone,
      resume.basics.contact?.email,
      resume.basics.contact?.wechat,
      resume.basics.location,
      resume.basics.github,
      resume.basics.website
    ].filter(Boolean);

    blocks.push(
      <section className="block" data-block key="basics">
        <div className="resume-header">
          <div className="resume-header-left">
            <h1 className="resume-name" style={{ fontSize: settings.nameSize }}>
              {resume.basics.name || '姓名'}
            </h1>
            {resume.basics.title && (
              <div className="resume-title" style={{ fontSize: settings.headingSize }}>
                {resume.basics.title}
              </div>
            )}
          </div>
          {headerRightMetaItems.length > 0 && (
            <div className="resume-header-right" style={{ fontSize: settings.bodySize }}>
              {headerRightMetaItems.map((text, idx) => (
                <span key={`hdr-${idx}`} className="resume-inline-item">
                  {text}
                </span>
              ))}
            </div>
          )}
        </div>

        {contactItems.length > 0 && (
          <div className="resume-contact" style={{ fontSize: settings.bodySize }}>
            {contactItems.map((text, idx) => (
              <span key={`contact-${idx}`} className="resume-inline-item muted">
                {text}
              </span>
            ))}
          </div>
        )}
      </section>
    );

    // Core abilities
    if (resume.coreAbilities.length) {
      blocks.push(
        <section className="block" data-block key="core">
          <h2 style={{ fontSize: settings.headingSize }}>个人优势</h2>
          <ul>
            {resume.coreAbilities.map((item, idx) => (
              <li key={idx} style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
    }

    // Work experiences
    if (resume.experiences.length) {
      resume.experiences.forEach((exp, index) => {
        const blockKey = `${exp.company}-${index}`;
        blocks.push(
          <section className="block exp-block" data-block key={blockKey}>
            {index === 0 && <h2 style={{ fontSize: settings.headingSize }}>工作经历</h2>}
            <h3 className="exp-title" style={{ fontSize: settings.headingSize - 2 }}>
              <span className="exp-title-left">
                {exp.position}
                {exp.company ? ` · ${exp.company}` : ''}
              </span>
              {(exp.start || exp.end) && (
                <span className="exp-title-right muted">
                  {[exp.start, exp.end].filter(Boolean).join(' - ')}
                </span>
              )}
            </h3>
            {exp.responsibilities && (
              <p className="exp-summary" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                {renderInlineMd(exp.responsibilities)}
              </p>
            )}

            {exp.projects.length > 0 && (
              <div className="exp-subsection">
                <div className="exp-subtitle" style={{ fontSize: settings.bodySize }}>
                  项目经历
                </div>
                {exp.projects.map((project, pIndex) => (
                  <div key={`${blockKey}-project-${pIndex}`} className="project">
                    <h4 style={{ fontSize: settings.headingSize - 3 }}>
                      {project.name}
                    </h4>
                    {project.description && (
                      <p className="project-desc" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                        {renderInlineMd(project.description)}
                      </p>
                    )}
                    {project.techStack && (
                      <p className="project-stack" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                        <span className="label">技术栈：</span>
                        {renderInlineMd(project.techStack)}
                      </p>
                    )}
                    {project.contributions.length > 0 && (
                      <div className="project-contrib">
                        {project.contributions.map((group, gIndex) => (
                          <div key={`${blockKey}-g-${gIndex}`} className="contrib-group">
                            {!!group.title && (
                              <div className="contrib-title" style={{ fontSize: settings.bodySize }}>
                                {renderInlineMd(group.title)}
                              </div>
                            )}
                            {group.items.length > 0 && (
                              <ul>
                                {group.items.map((item, i) => (
                                  <li
                                    key={`${blockKey}-g-${gIndex}-i-${i}`}
                                    style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}
                                  >
                                    {renderInlineMd(item)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      });
    }

    // Education
    if (resume.education.length) {
      blocks.push(
        <section className="block" data-block key="education">
          <h2 style={{ fontSize: settings.headingSize }}>教育背景</h2>
          {resume.education.map((edu, idx) => {
            const left = [edu.school, edu.major].filter(Boolean).join(' · ');
            const rightParts = [
              edu.degree,
              edu.graduation ? `${edu.graduation} 毕业` : ''
            ].filter(Boolean);
            const right = rightParts.join(' · ');
            return (
              <div key={idx} className="edu-row" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                <span className="edu-left">{left}</span>
                <span className="edu-right muted">{right}</span>
              </div>
            );
          })}
        </section>
      );
    }

    return blocks;
  }, [resume, settings]);

  const pages = useMemo(() => {
    const slices: React.ReactNode[][] = [];
    let current: React.ReactNode[] = [];
    contentBlocks.forEach((block, idx) => {
      if (breakIndices.has(idx) && current.length) {
        slices.push(current);
        current = [];
      }
      current.push(block);
    });
    if (current.length) slices.push(current);
    return slices;
  }, [breakIndices, contentBlocks]);

  return (
    <div className="preview-shell" style={typographyStyle}>
      <div className="page-container" ref={flowRef}>
        {pages.map((blocks, idx) => (
          <div className="page" data-page key={`page-${idx}`}>
            <div className="resume" data-exp-style={settings.experienceStyle}>
              {blocks}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;
