import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import SignUpPage from "./page";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the signup title and fields", () => {
    render(<SignUpPage />);
    expect(screen.getByText("アカウント作成")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード（6文字以上）")).toBeInTheDocument();
  });

  it("shows error message and disables button when password is too short", async () => {
    render(<SignUpPage />);
    
    const passwordInput = screen.getByPlaceholderText("パスワード（6文字以上）");
    const submitButton = screen.getByRole("button", { name: "アカウント登録" });

    // Initial state: empty password, button should be enabled (since no error message yet)
    // Actually, in my implementation: disabled={loading || (password.length > 0 && !isPasswordValid)}
    // If length is 0, it's not disabled by the validation rule, but HTML 'required' handles it.
    
    fireEvent.change(passwordInput, { target: { value: "12345" } });
    
    expect(screen.getByText("パスワードは6文字以上である必要があります。")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("enables button when password is long enough", () => {
    render(<SignUpPage />);
    
    const passwordInput = screen.getByPlaceholderText("パスワード（6文字以上）");
    const submitButton = screen.getByRole("button", { name: "アカウント登録" });

    fireEvent.change(passwordInput, { target: { value: "123456" } });
    
    expect(screen.queryByText("パスワードは6文字以上である必要があります。")).not.toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it("calls supabase.auth.signUp and shows success message", async () => {
    const mockSignUp = vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: {} as any, session: null },
      error: null,
    });

    render(<SignUpPage />);
    
    const emailInput = screen.getByPlaceholderText("メールアドレス");
    const passwordInput = screen.getByPlaceholderText("パスワード（6文字以上）");
    const submitButton = screen.getByRole("button", { name: "アカウント登録" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: expect.any(Object),
      });
      expect(toast.success).toHaveBeenCalledWith("確認メールを送信しました。メールをご確認ください。");
    });
  });

  it("shows translated error message when email is already registered", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" } as any,
    });

    render(<SignUpPage />);
    
    const emailInput = screen.getByPlaceholderText("メールアドレス");
    const passwordInput = screen.getByPlaceholderText("パスワード（6文字以上）");
    const submitButton = screen.getByRole("button", { name: "アカウント登録" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("このメールアドレスは既に登録されています。");
    });
  });
});
