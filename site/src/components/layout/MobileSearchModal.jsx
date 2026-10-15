import SearchBox from "../SearchBox.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export function MobileSearchModal({
  isOpen,
  visualViewportStyle,
  q,
  setQ,
  allUsedSongs,
  allUnits,
  allVenues,
  onClose,
  onSelectSong,
  onSelectUnit,
  onSelectVenue,
  onSelectShow,
  onOpenCalendar,
}) {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 flex flex-col bg-card/95 backdrop-blur-md sm:hidden overflow-hidden"
      style={{
        height: visualViewportStyle.height,
        top: visualViewportStyle.top,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("mobile.globalSearchAria", "全域搜尋")}
    >
      <SearchBox
        q={q}
        setQ={setQ}
        allUsedSongs={allUsedSongs}
        allUnits={allUnits}
        allVenues={allVenues}
        autoFocus={true}
        isMobileModal={true}
        onCloseModal={onClose}
        onSelectSong={onSelectSong}
        onSelectUnit={onSelectUnit}
        onSelectVenue={onSelectVenue}
        onSelectShow={onSelectShow}
        onOpenCalendar={onOpenCalendar}
      />
    </div>
  );
}
