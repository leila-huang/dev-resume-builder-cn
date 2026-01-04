import { Fragment, useMemo, useRef, type CSSProperties } from 'react';
import { usePagination } from '../hooks/usePagination';
import type { Resume, TypographySettings } from '../types/resume';
import { MarkdownBlock, MarkdownInline } from './Markdown';
import { ContactIcon, type ContactIconType } from './ContactIcon';

interface PreviewProps {
  resume: Resume;
  settings: TypographySettings;
}

const Preview = ({ resume, settings }: PreviewProps) => {
  const flowRef = useRef<HTMLDivElement>(null);
  const { breakIndices } = usePagination(flowRef, [resume, settings]);

  const titleSize = useMemo(() => {
    // Make the title under name visually closer to name size (more balanced)
    return Math.max(settings.headingSize, Math.round(settings.nameSize * 0.68));
  }, [settings.headingSize, settings.nameSize]);

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
      { type: 'phone' as const, text: resume.basics.contact?.phone },
      { type: 'email' as const, text: resume.basics.contact?.email },
      { type: 'wechat' as const, text: resume.basics.contact?.wechat },
      { type: 'location' as const, text: resume.basics.location },
      { type: 'github' as const, text: resume.basics.github },
      { type: 'website' as const, text: resume.basics.website }
    ]
      .filter((item): item is { type: ContactIconType; text: string } => Boolean(item.text))
      .map((item) => ({ type: item.type, text: item.text.trim() }));

    blocks.push(
      <section className="block" data-block key="basics">
        <div className="resume-header">
          <div className="resume-header-left">
            <h1 className="resume-name" style={{ fontSize: settings.nameSize }}>
              {resume.basics.name || '姓名'}
            </h1>
            {resume.basics.title && (
              <div className="resume-title" style={{ fontSize: titleSize }}>
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
            {contactItems.map((item, idx) => (
              <span key={`contact-${idx}`} className="resume-inline-item muted contact-item">
                <ContactIcon type={item.type} />
                <span className="contact-text">{item.text}</span>
              </span>
            ))}
          </div>
        )}
      </section>
    );

    // Core abilities
    if (resume.coreAbilities.length) {
      // Split into small chunks so the first page won't become mostly blank
      // when header/title sizes change and the full list doesn't fit.
      const chunkSize = 3;
      for (let start = 0; start < resume.coreAbilities.length; start += chunkSize) {
        const slice = resume.coreAbilities.slice(start, start + chunkSize);
        blocks.push(
          <section className="block core-block" data-block key={`core-${start}`}>
            {start === 0 && <h2 style={{ fontSize: settings.headingSize }}>个人优势</h2>}
            <ul>
              {slice.map((item, idx) => (
                <li key={`${start}-${idx}`} style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        );
      }
    }

    // Work experiences
    if (resume.experiences.length) {
      resume.experiences.forEach((exp, index) => {
        const blockKey = `${exp.company}-${index}`;
        // Experience header as its own block (projects become separate blocks to avoid overflow/clipping)
        blocks.push(
          <section
            className={`block exp-block ${index > 0 ? 'exp-block-sep' : ''}`}
            data-block
            key={`${blockKey}-exp`}
          >
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
                <MarkdownInline text={exp.responsibilities} />
              </p>
            )}
            {exp.projects.length > 0 && (
              <div className="exp-subtitle" style={{ fontSize: settings.bodySize }}>
                项目经历
              </div>
            )}
          </section>
        );

        exp.projects.forEach((project, pIndex) => {
          const hasContrib = !!project.contributionsMarkdown?.trim() || project.contributions.length > 0;
          blocks.push(
            <section className="block project-block" data-block key={`${blockKey}-project-${pIndex}`}>
              <div className="project">
                <h4 style={{ fontSize: settings.headingSize - 3 }}>{project.name}</h4>
                {project.description && (
                  <p className="project-desc" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                    <MarkdownInline text={project.description} />
                  </p>
                )}
                {project.techStack && (
                  <p className="project-stack" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                    <span className="label">技术栈：</span>
                    <MarkdownInline text={project.techStack} />
                  </p>
                )}
                {hasContrib && (
                  <div className="project-contrib-heading" style={{ fontSize: settings.bodySize }}>
                    主要贡献
                  </div>
                )}
                {!!project.contributionsMarkdown?.trim() && (
                  <div className="project-contrib" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                    <MarkdownBlock markdown={project.contributionsMarkdown} variant="contrib" />
                  </div>
                )}
                {!project.contributionsMarkdown?.trim() && project.contributions.length > 0 && (
                  <div className="project-contrib" style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                    {project.contributions.map((group, gIndex) => (
                      <div key={`${blockKey}-g-${gIndex}`} className="contrib-group">
                        {!!group.title && (
                          <div className="contrib-title" style={{ fontSize: settings.bodySize }}>
                            <MarkdownInline text={group.title} />
                          </div>
                        )}
                        {group.items.length > 0 && (
                          <ul>
                            {group.items.map((item, i) => (
                              <li
                                key={`${blockKey}-g-${gIndex}-i-${i}`}
                                style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}
                              >
                                <MarkdownInline text={item} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        });
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
          <div
            className="page"
            data-page
            key={`page-${idx}`}
            style={{
              paddingTop: `${settings.pagePaddingTopMm}mm`,
              paddingBottom: `${settings.pagePaddingBottomMm}mm`,
              paddingLeft: `${settings.pagePaddingLeftMm}mm`,
              paddingRight: `${settings.pagePaddingRightMm}mm`
            }}
          >
            <div
              className="resume"
              data-exp-style={settings.experienceStyle}
              style={
                {
                  fontSize: settings.bodySize,
                  lineHeight: settings.lineHeight,
                  ['--content-gap-base' as any]: `${settings.contentGapPx}px`
                } as CSSProperties
              }
            >
              {blocks}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;
