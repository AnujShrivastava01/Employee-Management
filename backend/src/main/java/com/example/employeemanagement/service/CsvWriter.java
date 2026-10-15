package com.example.employeemanagement.service;

import java.io.IOException;
import java.io.Writer;
import java.util.List;

/** Minimal RFC 4180 writer that also defuses spreadsheet formula injection. */
public final class CsvWriter {

    private static final String LINE_END = "\r\n";

    private final Writer out;

    public CsvWriter(Writer out) {
        this.out = out;
    }

    public void writeRow(List<String> cells) throws IOException {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                out.write(',');
            }
            out.write(escape(cells.get(i)));
        }
        out.write(LINE_END);
    }

    /**
     * Quotes cells containing separators, quotes or line breaks and neutralises values that spreadsheet
     * software would interpret as a formula (leading {@code = + - @}, tab or carriage return) by
     * prefixing a single quote, as recommended by OWASP.
     */
    static String escape(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        String safe = startsLikeFormula(value) ? "'" + value : value;
        boolean needsQuotes = safe.indexOf(',') >= 0 || safe.indexOf('"') >= 0
                || safe.indexOf('\n') >= 0 || safe.indexOf('\r') >= 0;
        return needsQuotes ? '"' + safe.replace("\"", "\"\"") + '"' : safe;
    }

    private static boolean startsLikeFormula(String value) {
        return switch (value.charAt(0)) {
            case '=', '+', '-', '@', '\t', '\r' -> true;
            default -> false;
        };
    }
}
