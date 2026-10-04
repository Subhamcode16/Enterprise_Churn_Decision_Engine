"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import UserProfileDrawer from "@/components/UserProfileDrawer";
import { useAuth } from "@/lib/auth";

export default function GlobalAuthModals() {
  const { isAuthenticated } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleOpenAuth = () => {
      setIsAuthOpen(true);
      setIsProfileOpen(false);
    };

    const handleOpenProfile = () => {
      if (isAuthenticated) {
        setIsProfileOpen(true);
        setIsAuthOpen(false);
      } else {
        setIsAuthOpen(true);
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("open-valence-auth", handleOpenAuth);
    window.addEventListener("open-valence-profile", handleOpenProfile);

    return () => {
      window.removeEventListener("open-valence-auth", handleOpenAuth);
      window.removeEventListener("open-valence-profile", handleOpenProfile);
    };
  }, [isAuthenticated]);

  return (
    <>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          // Auto open profile drawer on successful login/registration
          setTimeout(() => setIsProfileOpen(true), 300);
        }}
      />
      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
