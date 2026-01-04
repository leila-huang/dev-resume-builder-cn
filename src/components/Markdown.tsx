import { Fragment, useMemo } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type {
  Root,
  Content,
  Paragraph,
  Text,
  Strong,
  Emphasis,
  InlineCode,
  Link,
  List,
  ListItem,
  Heading,
  Code,
  Break
} from 'mdast';

type Variant = 'default' | 'contrib';

const mdProcessor = unified().use(remarkParse);

const renderInline = (nodes: Content[], keyPrefix: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];

  nodes.forEach((n, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (n.type === 'text') {
      out.push((n as Text).value);
      return;
    }
    if (n.type === 'strong') {
      const strong = n as Strong;
      out.push(<strong key={key}>{renderInline(strong.children as Content[], key)}</strong>);
      return;
    }
    if (n.type === 'emphasis') {
      const em = n as Emphasis;
      out.push(<em key={key}>{renderInline(em.children as Content[], key)}</em>);
      return;
    }
    if (n.type === 'inlineCode') {
      const code = n as InlineCode;
      out.push(<code key={key}>{code.value}</code>);
      return;
    }
    if (n.type === 'link') {
      const link = n as Link;
      const text = renderInline(link.children as Content[], key);
      if (link.url) {
        out.push(
          <a key={key} href={link.url} target="_blank" rel="noreferrer">
            {text}
          </a>
        );
      } else {
        out.push(<Fragment key={key}>{text}</Fragment>);
      }
      return;
    }
    if (n.type === 'break') {
      out.push(<br key={key} />);
      return;
    }

    // Fallback: render as plain text-ish
    if ('children' in n && Array.isArray((n as any).children)) {
      out.push(<Fragment key={key}>{renderInline((n as any).children as Content[], key)}</Fragment>);
      return;
    }
  });

  return out;
};

const renderBlock = (node: Content, keyPrefix: string): React.ReactNode => {
  if (node.type === 'paragraph') {
    const p = node as Paragraph;
    return <p key={keyPrefix}>{renderInline(p.children as Content[], keyPrefix)}</p>;
  }
  if (node.type === 'list') {
    const list = node as List;
    const Tag = list.ordered ? 'ol' : 'ul';
    return (
      <Tag key={keyPrefix}>
        {list.children.map((li, idx) => renderBlock(li as Content, `${keyPrefix}-li-${idx}`))}
      </Tag>
    );
  }
  if (node.type === 'listItem') {
    const li = node as ListItem;
    return (
      <li key={keyPrefix}>
        {li.children.map((c, idx) => {
          // avoid extra <p> wrappers for common "single paragraph" list items
          if (c.type === 'paragraph') {
            const p = c as Paragraph;
            return <Fragment key={`${keyPrefix}-p-${idx}`}>{renderInline(p.children as Content[], `${keyPrefix}-p-${idx}`)}</Fragment>;
          }
          return renderBlock(c as Content, `${keyPrefix}-c-${idx}`);
        })}
      </li>
    );
  }
  if (node.type === 'heading') {
    const h = node as Heading;
    const HTag = (`h${Math.min(6, Math.max(1, h.depth))}` as keyof JSX.IntrinsicElements);
    return <HTag key={keyPrefix}>{renderInline(h.children as Content[], keyPrefix)}</HTag>;
  }
  if (node.type === 'code') {
    const c = node as Code;
    return (
      <pre key={keyPrefix}>
        <code>{c.value}</code>
      </pre>
    );
  }
  if (node.type === 'break') {
    return <br key={keyPrefix} />;
  }
  if (node.type === 'text') {
    return (node as Text).value;
  }

  // Inline nodes at root-level fallback
  if ('children' in node && Array.isArray((node as any).children)) {
    return <Fragment key={keyPrefix}>{renderInline((node as any).children as Content[], keyPrefix)}</Fragment>;
  }

  return null;
};

export const MarkdownBlock = ({ markdown, variant = 'default' }: { markdown: string; variant?: Variant }) => {
  const root = useMemo(() => mdProcessor.parse(markdown) as Root, [markdown]);
  return (
    <div className={`md-block ${variant === 'contrib' ? 'md-contrib' : ''}`}>
      {root.children.map((n, idx) => renderBlock(n as Content, `md-${idx}`))}
    </div>
  );
};

export const MarkdownInline = ({ text }: { text: string }) => {
  const root = useMemo(() => mdProcessor.parse(text) as Root, [text]);

  // Most inline strings parse into a single paragraph
  if (root.children.length === 1 && root.children[0].type === 'paragraph') {
    const p = root.children[0] as Paragraph;
    return <>{renderInline(p.children as Content[], 'inline')}</>;
  }

  return <>{root.children.map((n, idx) => <Fragment key={idx}>{renderBlock(n as Content, `inline-${idx}`)}</Fragment>)}</>;
};


