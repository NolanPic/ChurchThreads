import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OneTimePassword } from "../ui/OneTimePassword";

describe("OneTimePassword", () => {
  test("renders the correct number of slots", () => {
    render(<OneTimePassword slots={5} />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByLabelText(`Digit ${i} of 5`)).toBeInTheDocument();
    }
  });

  test("displays error message when provided", () => {
    const errorMessage = "The code is either incorrect or has expired";
    render(<OneTimePassword slots={6} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  test("calls onChange when values change", () => {
    const handleChange = vi.fn();
    render(<OneTimePassword slots={5} onChange={handleChange} />);

    const firstInput = screen.getByLabelText("Digit 1 of 5");
    fireEvent.change(firstInput, { target: { value: "1" } });

    expect(handleChange).toHaveBeenCalledWith("1");
  });

  test("calls onComplete when all slots are filled", () => {
    const handleComplete = vi.fn();
    render(<OneTimePassword slots={3} onComplete={handleComplete} />);

    const inputs = [
      screen.getByLabelText("Digit 1 of 3"),
      screen.getByLabelText("Digit 2 of 3"),
      screen.getByLabelText("Digit 3 of 3"),
    ];

    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });
    fireEvent.change(inputs[2], { target: { value: "3" } });

    expect(handleComplete).toHaveBeenCalledWith("123");
  });

  test("handles paste events correctly", () => {
    const handleChange = vi.fn();
    render(<OneTimePassword slots={5} onChange={handleChange} />);

    const firstInput = screen.getByLabelText("Digit 1 of 5");
    fireEvent.paste(firstInput, {
      clipboardData: { getData: () => "12345" },
    });

    expect(handleChange).toHaveBeenCalledWith("12345");
  });
});
