/** Mock for ascii-table used in Jest tests */
class AsciiTable {
    private rows: any[][] = []

    addRowMatrix(rows: any[][]): this {
        this.rows = rows
        return this
    }

    removeBorder(): this {
        return this
    }

    toString(): string {
        return this.rows.map((row) => row.join(' ')).join('\n')
    }
}

export = AsciiTable
