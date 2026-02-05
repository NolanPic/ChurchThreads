import { renderToHTMLString } from '@tiptap/static-renderer'
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

const EXTENSIONS = [
    StarterKit.configure({
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        underline: false,
    }),
    Image,
    Youtube.configure({
        controls: true,
        nocookie: true,
    }),
];

export function fromJSONToHTML(content: string) {

    // TODO: Remove when seeding script is updated
    // check if content is already HTML
    if(content.startsWith("<")) {
        return content;
    }

    let parsedContent;

    try {
        parsedContent = JSON.parse(content);
    } catch(error) {
        console.error("Failed to parse thread content as JSON", error);
    }

    let html = '';

    try {
        html = renderToHTMLString({
            extensions: EXTENSIONS,
            content: parsedContent,
        });
    } catch(error) {
        console.error("Failed to render thread content to HTML", error);
    }

    return html;
}

export function fromJSONToPlainText(content: string, maxLength?: number): string {
    // If content is already HTML, strip tags
    if (content.startsWith("<")) {
        const text = content.replace(/<[^>]*>/g, '');
        return maxLength ? truncateText(text, maxLength) : text;
    }

    let parsedContent;
    try {
        parsedContent = JSON.parse(content);
    } catch (error) {
        console.error("Failed to parse content as JSON", error);
        return "";
    }

    // Extract text from TipTap JSON structure
    const extractText = (node: any): string => {
        if (typeof node === 'string') {
            return node;
        }

        if (!node || typeof node !== 'object') {
            return '';
        }

        let text = '';

        // Handle YouTube embeds
        if (node.type === 'youtube') {
            return '[Video] ';
        }

        // Handle text nodes
        if (node.text) {
            text += node.text;
        }

        // Handle nodes with content
        if (Array.isArray(node.content)) {
            text += node.content.map(extractText).join('');
        }

        // Add space after paragraphs for readability
        if (node.type === 'paragraph' && text) {
            text += ' ';
        }

        return text;
    };

    const plainText = extractText(parsedContent).trim();
    return maxLength ? truncateText(plainText, maxLength) : plainText;
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}
