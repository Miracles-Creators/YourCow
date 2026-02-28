const GenericModal = ({
  children,
  className = "flex flex-col relative w-full max-w-xs rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-6 shadow-xl",
  modalId,
}: {
  children: React.ReactNode;
  className?: string;
  modalId: string;
}) => {
  return (
    <label htmlFor={modalId} className="modal backdrop-blur-sm cursor-pointer">
      <label className={className} style={{ minHeight: "auto" }}>
        {/* dummy input to capture event onclick on modal box */}
        <input className="h-0 w-0 absolute top-0 left-0" />
        {children}
      </label>
    </label>
  );
};

export default GenericModal;
