import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button loading state", () => {
  it("shows a spinner, is busy and ignores clicks while loading", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeEnabled();
    expect(button.querySelector(".animate-spin")).toBeNull();

    rerender(<Button onClick={onClick} loading>Save</Button>);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector(".animate-spin")).not.toBeNull();
    await userEvent.setup().click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>Save</Button>);
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });
});
