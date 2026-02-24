import { ProductData } from "../types";

export const copyToClipboard = async (text: string, htmlText?: string): Promise<boolean> => {
  try {
    if (htmlText && navigator.clipboard && navigator.clipboard.write) {
      try {
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        const textBlob = new Blob([text], { type: 'text/plain' });
        // @ts-ignore - ClipboardItem is not fully typed in all TS envs yet
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        });
        await navigator.clipboard.write([clipboardItem]);
        return true;
      } catch (e) {
        // Fallback to text
        await navigator.clipboard.writeText(text);
        return true;
      }
    } else {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.error("Copy failed", e);
    return false;
  }
};

export const generateDoctorCopyText = (data: ProductData) => {
  const fieldsToCopy = [
    { label: 'Торговое название', key: 'Торговое название' },
    { label: 'Состав', key: 'Состав' },
    { label: 'Показания к применению', key: 'Показания к применению' },
    { label: 'Способ применения и дозы', key: 'Способ применения и дозы' },
    { label: 'Беременность и лактация', key: 'Беременность и лактация' }
  ];

  let textToCopy = '';
  let htmlToCopy = '<div style="font-family: sans-serif;">';

  let hasData = false;

  fieldsToCopy.forEach(field => {
    const realKey = Object.keys(data).find(dk => dk.toLowerCase() === field.key.toLowerCase());
    if (realKey && data[realKey]) {
      hasData = true;
      textToCopy += `**${field.label}:**\n${data[realKey]}\n\n`;
      const escapedValue = data[realKey].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      htmlToCopy += `<p><strong>${field.label}:</strong><br>${escapedValue.replace(/\n/g, '<br>')}</p>`;
    }
  });

  htmlToCopy += '</div>';
  return hasData ? { text: textToCopy.trim(), html: htmlToCopy } : null;
};
