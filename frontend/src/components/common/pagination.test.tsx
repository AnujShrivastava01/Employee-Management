import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination, pageWindow } from "./pagination";

describe("pageWindow", () => {
  it("lists every page when there are few", () => {
    expect(pageWindow(0, 4)).toEqual([0, 1, 2, 3]);
  });

  it("collapses long ranges around the current page", () => {
    expect(pageWindow(0, 20)).toEqual([0, 1, null, 19]);
    expect(pageWindow(10, 20)).toEqual([0, null, 9, 10, 11, null, 19]);
    expect(pageWindow(19, 20)).toEqual([0, null, 18, 19]);
  });
});

describe("<Pagination>", () => {
  const base = { page: 1, size: 10, totalElements: 36, totalPages: 4, onPageChange: vi.fn(), onSizeChange: vi.fn() };

  it("shows the visible range, total and page controls", () => {
    render(<Pagination {...base} />);
    expect(screen.getByText("11–20")).toBeInTheDocument();
    expect(screen.getByText("36")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("reports page and size changes using zero-based pages", async () => {
    const onPageChange = vi.fn();
    const onSizeChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination {...base} onPageChange={onPageChange} onSizeChange={onSizeChange} />);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Page 4" }));
    await user.selectOptions(screen.getByLabelText("Rows per page"), "50");

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables previous on the first page and next on the last", () => {
    const { rerender } = render(<Pagination {...base} page={0} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    rerender(<Pagination {...base} page={3} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});
