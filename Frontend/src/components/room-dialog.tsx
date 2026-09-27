"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Check,
  Copy,
  DoorOpen,
  Hash,
  Plus,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { generateRoomCode } from "@/lib/generateCode";
import { generateRoomName } from "@/lib/nameGenerator";

type RoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoomDialog({ open, onOpenChange }: RoomDialogProps) {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<"create" | "join">("create");

  // shared identity (host on create, audience on join)
  const [userName, setUserName] = React.useState("");

  // create state
  const [roomName, setRoomName] = React.useState("");
  const [createdCode, setCreatedCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // join state
  const [joinCode, setJoinCode] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setUserName("");
        setRoomName("");
        setCreatedCode(null);
        setCopied(false);
        setJoinCode("");
        setTab("create");
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const createLocalUser = (role: "host" | "audience") => {
    if (!userName.trim()) {
      toast.error("Enter your name first");
      return;
    }
    const user = { id: crypto.randomUUID(), name: userName.trim(), role };
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      toast.error("Enter your name first");
      return;
    }
    const host = createLocalUser("host");
    if (!host) {
      return;
    }
    const roomCode = generateRoomCode();
    const finalRoomName = roomName.trim() || generateRoomName();
    setCreatedCode(roomCode);
    toast.success("Room created", {
      description: `Hosting as ${userName.trim()} · code ${roomCode} · ${finalRoomName}`,
    });
  };

  const handleCopy = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  const handleJoin = async () => {
    if (!userName.trim()) {
      toast.error("Enter your name first");
      return;
    }
    if (joinCode.length < 6) {
      toast.error("Enter the full 6-character code");
      return;
    }
    
    const user = createLocalUser("audience");
    if (!user) {
      return;
    }
    toast.success(`Joining room ${joinCode}…`, {
      description: `As ${userName.trim()} · the lobby is loading.`,
    });
    onOpenChange(false);
    navigate(`/room/${joinCode}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        {/* glow header strip */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-transparent to-chart-3/10" />
          <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />

          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <DoorOpen className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight">
                  Enter a room
                </DialogTitle>
                <DialogDescription className="text-xs">
                  One door — create a new room or join one with a code.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "create" | "join")}
            className="gap-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Plus className="size-3.5" />
                Create
              </TabsTrigger>
              <TabsTrigger value="join">
                <Hash className="size-3.5" />
                Join
              </TabsTrigger>
            </TabsList>

            {/* CREATE */}
            <TabsContent value="create" className="mt-4">
              <AnimatePresence mode="wait" initial={false}>
                {createdCode ? (
                  <motion.div
                    key="created"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center gap-4 py-2"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Sparkles className="size-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Your room is ready
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Share this code to invite people in
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="group relative flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left transition hover:border-primary/70 hover:bg-primary/10"
                    >
                      <span className="text-xs text-muted-foreground">
                        Room code
                      </span>
                      <span className="font-mono text-xl font-bold tracking-[0.35em] text-foreground">
                        {createdCode}
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border transition group-hover:text-primary">
                        {copied ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                      <User className="size-3.5" />
                      Hosting as{" "}
                      <span className="font-medium text-foreground">
                        {userName.trim() || "you"}
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        if (createdCode) {
                          navigate(`/room/${createdCode}`);
                        }
                      }}
                    >
                      Open room
                      <ArrowRight className="size-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-4 py-1"
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="host-name" className="text-xs">
                        Your name{" "}
                        <span className="text-primary">*</span>
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="host-name"
                          placeholder="e.g. Alex"
                          className="pl-9 border-2 border-base"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          maxLength={24}
                          autoComplete="off"

                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="room-name" className="text-xs">
                        Room name{" "}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="room-name"
                        placeholder="e.g. Design sync"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        maxLength={32}
                        autoComplete="off"
                        className="border-2 border-base"
                      />
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      You&apos;ll be the host. A shareable code is generated
                      instantly.
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreateRoom}
                      disabled={!userName.trim()}
                    >
                      <Plus className="size-4" />
                      Create room
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* JOIN */}
            <TabsContent value="join" className="mt-4">
              <div className="flex flex-col gap-4 py-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-name" className="text-xs">
                    Your name <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="join-name"
                      placeholder="e.g. Sam"
                      className="pl-9 border-2 border-base"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      maxLength={24}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-character room code
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ask the host — it shows on their screen.
                  </p>
                </div>

                <div className="flex w-full justify-center">
                  <InputOTP
                    maxLength={6}
                    value={joinCode}
                    onChange={(val) =>
                      setJoinCode(val.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                    }
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-11 text-base border-2 border-base" />
                      <InputOTPSlot index={1} className="size-11 text-base border-2 border-base" />
                      <InputOTPSlot index={2} className="size-11 text-base border-2 border-base" />
                      <InputOTPSlot index={3} className="size-11 text-base border-2 border-base" />
                      <InputOTPSlot index={4} className="size-11 text-base border-2 border-base" />
                      <InputOTPSlot index={5} className="size-11 text-base border-2 border-base" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  onClick={handleJoin}
                  disabled={!userName.trim() || joinCode.length < 6}
                >
                  Join room
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
