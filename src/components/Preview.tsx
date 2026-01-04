import { useMemo, useRef } from 'react';
import { usePagination } from '../hooks/usePagination';
import type { Resume, TypographySettings } from '../types/resume';

interface PreviewProps {
  resume: Resume;
  settings: TypographySettings;
}

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
    const summaryItems = [
      resume.basics.title && `职位：${resume.basics.title}`,
      resume.basics.yearsOfExperience && `工作年限：${resume.basics.yearsOfExperience}`,
      resume.basics.gender && `性别：${resume.basics.gender}`,
      resume.basics.birth && `出生：${resume.basics.birth}`,
      resume.basics.location && `城市：${resume.basics.location}`
    ].filter(Boolean);

    const contactItems = [
      resume.basics.contact?.phone && `手机：${resume.basics.contact.phone}`,
      resume.basics.contact?.email && `邮箱：${resume.basics.contact.email}`,
      resume.basics.contact?.wechat && `微信：${resume.basics.contact.wechat}`,
      resume.basics.github && `GitHub：${resume.basics.github}`,
      resume.basics.website && `Website：${resume.basics.website}`
    ].filter(Boolean);

    const eduItems =
      resume.education.length > 0
        ? resume.education.map(
            (edu) =>
              [edu.school, edu.major, edu.degree, edu.graduation && `毕业：${edu.graduation}`]
                .filter(Boolean)
                .join(' ｜ ')
          )
        : [
            [resume.basics.school, resume.basics.major, resume.basics.degree, resume.basics.graduation && `毕业：${resume.basics.graduation}`]
              .filter(Boolean)
              .join(' ｜ ')
          ];

    blocks.push(
      <section className="block" data-block key="basics">
        <h1 style={{ fontSize: settings.nameSize }}>{resume.basics.name || '姓名'}</h1>
        <div className="meta-row">
          <ul className="pill-list">
            {summaryItems.map((text, idx) => (
              <li key={`summary-${idx}`} className="pill" style={{ fontSize: settings.bodySize }}>
                {text}
              </li>
            ))}
          </ul>
          {contactItems.length > 0 && (
            <ul className="pill-list muted">
              {contactItems.map((text, idx) => (
                <li key={`contact-${idx}`} className="pill" style={{ fontSize: settings.bodySize }}>
                  {text}
                </li>
              ))}
            </ul>
          )}
          {eduItems.filter(Boolean).length > 0 && (
            <ul className="pill-list muted">
              {eduItems
                .filter(Boolean)
                .map((text, idx) => (
                  <li key={`edu-${idx}`} className="pill" style={{ fontSize: settings.bodySize }}>
                    {text}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    );

    // Core abilities
    blocks.push(
      <section className="block" data-block key="core">
        <h2 style={{ fontSize: settings.headingSize }}>核心能力</h2>
        <ul>
          {resume.coreAbilities.map((item, idx) => (
            <li key={idx} style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    );

    // Work experiences
    if (resume.experiences.length) {
      resume.experiences.forEach((exp, index) => {
        const blockKey = `${exp.company}-${index}`;
        blocks.push(
          <section className="block" data-block key={blockKey}>
            {index === 0 && <h2 style={{ fontSize: settings.headingSize }}>工作经历</h2>}
            <h3 style={{ fontSize: settings.headingSize - 2 }}>
              {exp.position} ｜ {exp.company} ｜ {exp.start}–{exp.end}
            </h3>
            {exp.responsibilities && (
              <p style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                工作职责：{exp.responsibilities}
              </p>
            )}
            {exp.projects.map((project, pIndex) => (
              <div key={`${blockKey}-project-${pIndex}`} style={{ marginTop: 10 }}>
                <h4 style={{ fontSize: settings.headingSize - 3 }}>{project.name}</h4>
                {project.description && (
                  <p style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                    项目描述：{project.description}
                  </p>
                )}
                {project.techStack && (
                  <p style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                    技术栈：{project.techStack}
                  </p>
                )}
                {project.contributions.length > 0 && (
                  <ul>
                    {project.contributions.map((group, gIndex) => (
                      <li key={`${blockKey}-g-${gIndex}`} style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                        <strong>{group.title}</strong>
                        {group.items.length > 0 && (
                          <ul>
                            {group.items.map((item, i) => (
                              <li
                                key={`${blockKey}-g-${gIndex}-i-${i}`}
                                style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );
      });
    }

    // Education
    if (resume.education.length) {
      blocks.push(
        <section className="block" data-block key="education">
          <h2 style={{ fontSize: settings.headingSize }}>教育经历</h2>
          <ul>
            {resume.education.map((edu, idx) => (
              <li key={idx} style={{ fontSize: settings.bodySize, lineHeight: settings.lineHeight }}>
                {[edu.school, edu.major, edu.degree, edu.graduation && `毕业：${edu.graduation}`]
                  .filter(Boolean)
                  .join(' ｜ ')}
              </li>
            ))}
          </ul>
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
            <div className="resume">{blocks}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;
