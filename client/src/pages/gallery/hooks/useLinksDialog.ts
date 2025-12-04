import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import type { PhotoWithThumbnail } from "@shared/schema";

export interface LinkItem {
  id: string;
  url: string;
  deleteUrl: string;
}

export function useLinksDialog() {
  const { toast } = useToast();
  const { t } = useI18n();
  
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  const [linksToShow, setLinksToShow] = useState<LinkItem[]>([]);

  const showLinks = useCallback((photos: PhotoWithThumbnail[]) => {
    const photosWithLinks = photos.filter(p => p.cloud?.url);
    
    if (photosWithLinks.length === 0) {
      toast({
        title: t.gallery.noLinks,
        description: t.gallery.uploadFirst,
      });
      return false;
    }

    setLinksToShow(
      photosWithLinks.map(p => ({
        id: p.id,
        url: p.cloud!.url,
        deleteUrl: p.cloud!.deleteUrl,
      }))
    );
    setShowLinksDialog(true);
    return true;
  }, [toast, t]);

  const hideLinks = useCallback(() => {
    setShowLinksDialog(false);
    setLinksToShow([]);
  }, []);

  const handleCopyAllLinks = useCallback(async () => {
    const allLinks = linksToShow.map(l => l.url).join("\n");
    try {
      await navigator.clipboard.writeText(allLinks);
      toast({
        title: t.gallery.copied,
        description: t.gallery.linksCopied.replace("{count}", String(linksToShow.length)),
      });
    } catch {
      toast({
        title: t.common.error,
        description: t.gallery.copyFailed,
        variant: "destructive",
      });
    }
  }, [linksToShow, toast, t]);

  return {
    showLinksDialog,
    linksToShow,
    showLinks,
    hideLinks,
    handleCopyAllLinks,
  };
}
