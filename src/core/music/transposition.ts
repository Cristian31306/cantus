export type Notation = 'american' | 'latin';

const NOTES_AMERICAN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_LATIN = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Map for quick lookup
const NOTE_TO_INDEX: Record<string, number> = {};
NOTES_AMERICAN.forEach((note, index) => { NOTE_TO_INDEX[note] = index; });
// Handle flats manually for normalization
const FLATS: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B', 'Fb': 'E'
};

// Regex to identify chords: Root + (Optional Quality)
// Captures: 1=Root, 2=Rest (suffix + bass)
const CHORD_REGEX = /^([A-G](?:#|b)?|Do(?:#|b)?|Re(?:#|b)?|Mi(?:#|b)?|Fa(?:#|b)?|Sol(?:#|b)?|La(?:#|b)?|Si(?:#|b)?)(.*)$/;

export class Transposer {
    static normalize(note: string): string {
        // basic flat normalization
        if (FLATS[note]) return FLATS[note];
        return note;
    }

    static getNoteIndex(note: string): { index: number, notation: Notation } {
        // Try American
        let normalized = this.normalize(note);
        if (NOTE_TO_INDEX[normalized] !== undefined) return { index: NOTE_TO_INDEX[normalized], notation: 'american' };

        // Try Latin
        const latinIndex = NOTES_LATIN.indexOf(note);
        if (latinIndex !== -1) return { index: latinIndex, notation: 'latin' };

        return { index: -1, notation: 'american' };
    }

    static transpose(chord: string, semitones: number, targetNotation: Notation = 'american'): string {
        const match = chord.match(CHORD_REGEX);
        if (!match) return chord;

        const rootRaw = match[1];
        const rest = match[2]; // suffix + potential bass

        const { index: rootIndex } = this.getNoteIndex(rootRaw);
        if (rootIndex === -1) return chord;

        // Calculate new root
        let newRootIndex = (rootIndex + semitones) % 12;
        if (newRootIndex < 0) newRootIndex += 12;
        const newRoot = targetNotation === 'american' ? NOTES_AMERICAN[newRootIndex] : NOTES_LATIN[newRootIndex];

        // Handle splitting suffix and bass if slash exists
        let suffix = rest;
        let bass = '';

        if (rest.includes('/')) {
            const parts = rest.split('/');
            suffix = parts[0]; // e.g. "m7" from "Cm7/G"
            const bassRaw = parts[1]; // e.g. "G"

            const { index: bassIndex } = this.getNoteIndex(bassRaw);
            if (bassIndex !== -1) {
                let newBassIndex = (bassIndex + semitones) % 12;
                if (newBassIndex < 0) newBassIndex += 12;
                bass = targetNotation === 'american' ? NOTES_AMERICAN[newBassIndex] : NOTES_LATIN[newBassIndex];
            } else {
                bass = bassRaw; // logic fallback
            }
        }

        return `${newRoot}${suffix}${bass ? '/' + bass : ''}`;
    }

    static convertNotation(chord: string, targetNotation: Notation): string {
        return Transposer.transpose(chord, 0, targetNotation);
    }
}