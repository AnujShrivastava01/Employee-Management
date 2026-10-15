package com.example.employeemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CsvWriterTest {

    @Test
    void leavesPlainValuesUntouched() {
        assertThat(CsvWriter.escape("Ananya Iyer")).isEqualTo("Ananya Iyer");
    }

    @Test
    void quotesCommasQuotesAndLineBreaks() {
        assertThat(CsvWriter.escape("Iyer, Ananya")).isEqualTo("\"Iyer, Ananya\"");
        assertThat(CsvWriter.escape("The \"Boss\"")).isEqualTo("\"The \"\"Boss\"\"\"");
        assertThat(CsvWriter.escape("line1\nline2")).isEqualTo("\"line1\nline2\"");
        assertThat(CsvWriter.escape("line1\r\nline2")).isEqualTo("\"line1\r\nline2\"");
    }

    @ParameterizedTest
    @ValueSource(strings = {"=1+1", "+91 98765", "-2+3", "@SUM(A1)", "\tcmd", "\rcmd"})
    void neutralisesSpreadsheetFormulas(String value) {
        // The quote prefix goes in front of the original text; the cell is then quoted if it needs to be (e.g. CR).
        assertThat(CsvWriter.escape(value)).matches(escaped -> escaped.equals("'" + value) || escaped.equals("\"'" + value + "\""));
    }

    @Test
    void escapesCombinationOfFormulaAndSeparator() {
        assertThat(CsvWriter.escape("=HYPERLINK(\"http://x\",\"y\")")).isEqualTo("\"'=HYPERLINK(\"\"http://x\"\",\"\"y\"\")\"");
    }

    @Test
    void rendersNullAndEmptyAsEmptyCells() throws IOException {
        StringWriter out = new StringWriter();
        new CsvWriter(out).writeRow(Arrays.asList("a", null, ""));
        assertThat(out.toString()).isEqualTo("a,,\r\n");
    }

    @Test
    void terminatesRowsWithCrlf() throws IOException {
        StringWriter out = new StringWriter();
        CsvWriter csv = new CsvWriter(out);
        csv.writeRow(List.of("h1", "h2"));
        csv.writeRow(List.of("1", "2"));
        assertThat(out.toString()).isEqualTo("h1,h2\r\n1,2\r\n");
    }
}
