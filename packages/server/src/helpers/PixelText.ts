const glyphs: Record<string, any> = {
    0: `
    .###.
    #...#
    #...#
    #...#
    .###.`,

    1: `
    .##..
    ..#..
    ..#..
    ..#..
    ..#..`,

    2: `
    ####.
    ....#
    .###.
    #....
    #####`,

    3: `
    ####.
    ....#
    ..##.
    ....#
    ####.`,

    4: `
    #...#
    #...#
    #####
    ....#
    ....#`,

    5: `
    #####
    #....
    .###.
    ....#
    ####.`,

    6: `
    .###.
    #....
    ####.
    #...#
    .###.`,

    7: `
    #####
    ....#
    ...#.
    ..#..
    .#...`,

    8: `
    .###.
    #...#
    .###.
    #...#
    .###.`,

    9: `
    .###.
    #...#
    .####
    ....#
    ####.`,

    '.': `
    .....
    .....
    .....
    ..##.
    ..##.`,
};

const glpyhPixels = Object.keys(glyphs).reduce((map: Record<string, boolean[][]>, key: string) => {
    map[key] = glyphs[key].trim().split('\n').map((l: string) => {
        return l.trim().split('').map((c: string) => c === '#');
    });
    return map;
}, {});

type Point = [x: number, y: number];
type RenderOutput = {
    points: Point[],
    width: number,
    height: number,
};

export const renderTextToPoints = (s: string): RenderOutput => {
    const points: Point[] = [];
    let width = 0;
    let height = 0;

    for (let i = 0; i < s.length; i++) {
        const char = s.charAt(i);
        const rows = glpyhPixels[char];
        if (!rows) {
            throw new Error(`Missing char '${char}'`);
        }

        if (i !== 0) {
            width += 1; // char spacing
        }

        let charWidth = 0;
        rows.forEach((cols, row) => {
            cols.forEach((isOn, col) => {
                if (isOn) {
                    points.push([width + col, row]);
                }
            });

            charWidth = Math.max(charWidth, cols.length);
        });

        height = Math.max(height, rows.length);
        
        width += charWidth;
    }

    return {
        points,
        height,
        width,
    };
};