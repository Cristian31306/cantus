import { type Notation, Transposer } from './transposition';

export class ChordProParser {
    /**
     * Transposes a ChordPro string by a number of semitones.
     * @param text The text in ChordPro format (e.g. "[C]Hello [G]World")
     * @param semitones Number of semitones to shift (+/-)
     * @param targetNotation Desired output notation ('american' or 'latin')
     * @returns Transposed text
     */
    static transpose(text: string, semitones: number, targetNotation: Notation = 'american'): string {
        return text.replace(/\[([^\]]+)\]/g, (_match, chord) => {
            const transposedChord = Transposer.transpose(chord, semitones, targetNotation);
            return `[${transposedChord}]`;
        });
    }

    /**
     * Extracts just the lyrics (removes chords)
     */
    static getLyrics(text: string): string {
        return text.replace(/\[([^\]]+)\]/g, '');
    }

    /**
     * Formats the content for display (e.g. bolding chords, etc. 
     * though usually we just render the ChordPro directly with a component)
     * This is a placeholder for future formatting logic.
     */
    static format(text: string): string {
        return text;
    }
}
