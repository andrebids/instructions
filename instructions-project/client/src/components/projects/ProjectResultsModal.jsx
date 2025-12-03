import React, { useRef, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, useDisclosure } from "@heroui/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Mousewheel, Keyboard } from 'swiper/modules';
import { Icon } from "@iconify/react";
import ImageAnnotationEditor from '../project-notes/ImageAnnotationEditor';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export const LANDSCAPES = [
    {
        id: 0,
        title: 'Result Proposal 1',
        src: '/demo-images/results/landscape-1.jpg'
    },
    {
        id: 1,
        title: 'Result Proposal 2',
        src: '/demo-images/results/landscape-2.jpg'
    },
    {
        id: 2,
        title: 'Result Proposal 3',
        src: '/demo-images/results/landscape-3.jpg'
    },
    {
        id: 3,
        title: 'Result Proposal 4',
        src: '/demo-images/results/landscape-4.jpg'
    },
    {
        id: 4,
        title: 'Result Proposal 5',
        src: '/demo-images/results/landscape-5.jpg'
    },
    {
        id: 5,
        title: 'Result Proposal 6',
        src: '/demo-images/results/landscape-6.jpg'
    }
];

export default function ProjectResultsModal({ isOpen, onOpenChange, projectId, onModificationSubmitted }) {
    const swiperRef = useRef(null);
    const [showAllView, setShowAllView] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modificationRequest, setModificationRequest] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Annotation states
    const { isOpen: isAnnotationModalOpen, onOpen: onAnnotationModalOpen, onOpenChange: onAnnotationModalOpenChange } = useDisclosure();
    const [annotatedImageData, setAnnotatedImageData] = useState(null);

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setModificationRequest('');
        setAnnotatedImageData(null);
    };

    const handleCloseDetailModal = () => {
        setSelectedImage(null);
        setModificationRequest('');
        setAnnotatedImageData(null);
    };

    const handleSaveAnnotation = (blob, dataUrl) => {
        setAnnotatedImageData({
            dataUrl: dataUrl,
            blob: blob
        });
        onAnnotationModalOpenChange();
    };

    const handleCancelAnnotation = () => {
        onAnnotationModalOpenChange();
    };

    const handleSubmitModification = async () => {
        if (!modificationRequest.trim()) return;

        setIsSubmitting(true);

        try {
            // Prepare observation data
            const observationData = {
                content: modificationRequest,
                linkedResultImageId: selectedImage?.id,
                attachments: annotatedImageData ? [{
                    name: `annotated_${selectedImage.title}.png`,
                    type: 'image/png',
                    url: annotatedImageData.dataUrl
                }] : []
            };

            // Send to observations API
            const apiBase = (import.meta?.env?.VITE_API_URL || '').replace(/\/api$/, '') || '';
            const response = await fetch(`${apiBase}/api/projects/${projectId}/observations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(observationData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to send modification request');
            }

            // Notify parent component
            onModificationSubmitted?.();

            // Close modals and reset
            handleCloseDetailModal();
            onOpenChange(false);

        } catch (error) {
            console.error('Error sending modification:', error);
            // Show user-friendly error message
            const errorMessage = error.message || 'Failed to send modification request. Please try again.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleThumbnailClick = (index) => {
        setShowAllView(false);
        swiperRef.current?.slideTo(index);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="5xl"
                backdrop="blur"
                scrollBehavior="inside"
                hideCloseButton
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex justify-between items-center">
                                <span>Project Results</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-background/60 backdrop-blur-md border border-default-200 hover:bg-default-100 text-foreground font-medium shadow-sm transition-all"
                                        startContent={<Icon icon={showAllView ? "lucide:grid-3x3" : "lucide:layout-grid"} className="text-lg" />}
                                        onPress={() => setShowAllView(!showAllView)}
                                        radius="full"
                                    >
                                        {showAllView ? 'Carousel' : 'Show All'}
                                    </Button>
                                    <Button
                                        color="danger"
                                        variant="light"
                                        size="sm"
                                        onPress={onClose}
                                        radius="full"
                                        className="font-medium hover:bg-danger/10 border border-danger/20"
                                        startContent={<Icon icon="lucide:x" className="text-lg" />}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </ModalHeader>
                            <ModalBody className="p-0 pb-20 overflow-hidden">
                                {showAllView ? (
                                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {LANDSCAPES.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 border-transparent hover:border-primary transition-all"
                                                onClick={() => handleImageClick(item)}
                                            >
                                                <img
                                                    src={item.src}
                                                    alt={item.title}
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <Icon icon="lucide:eye" className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                                    <p className="text-white text-sm font-semibold">{item.title}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative w-full bg-black/5">
                                        {/* Custom Navigation Buttons */}
                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            radius="full"
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 text-white hover:bg-black/40 hidden md:flex"
                                            onPress={() => swiperRef.current?.slidePrev()}
                                            aria-label="Previous image"
                                        >
                                            <Icon icon="lucide:chevron-left" className="text-2xl" />
                                        </Button>

                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            radius="full"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 text-white hover:bg-black/40 hidden md:flex"
                                            onPress={() => swiperRef.current?.slideNext()}
                                            aria-label="Next image"
                                        >
                                            <Icon icon="lucide:chevron-right" className="text-2xl" />
                                        </Button>

                                        <Swiper
                                            modules={[Autoplay, Mousewheel, Keyboard]}
                                            onSwiper={(swiper) => {
                                                swiperRef.current = swiper;
                                            }}
                                            loop={true}
                                            centeredSlides={true}
                                            slidesPerView={1}
                                            autoHeight={true}
                                            autoplay={{
                                                delay: 3000,
                                                disableOnInteraction: false,
                                                pauseOnMouseEnter: true,
                                            }}
                                            speed={800}
                                            mousewheel={true}
                                            keyboard={{ enabled: true }}
                                            className="w-full"
                                        >
                                            {LANDSCAPES.map((item) => (
                                                <SwiperSlide
                                                    key={item.id}
                                                    className="w-full"
                                                >
                                                    <div
                                                        className="relative w-full group cursor-pointer"
                                                        onClick={() => handleImageClick(item)}
                                                    >
                                                        <img
                                                            src={item.src}
                                                            alt={item.title}
                                                            className="w-full object-contain"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                            <Icon icon="lucide:maximize-2" className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                            <h3 className="text-white text-2xl font-bold">{item.title}</h3>
                                                        </div>
                                                    </div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>
                                )}
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Image Detail Modal */}
            <Modal
                isOpen={!!selectedImage}
                onOpenChange={handleCloseDetailModal}
                size="3xl"
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                {selectedImage?.title}
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div className="relative aspect-video rounded-lg overflow-hidden group">
                                        <img
                                            src={annotatedImageData?.dataUrl || selectedImage?.src}
                                            alt={selectedImage?.title}
                                            className="w-full h-full object-contain"
                                        />
                                        {/* Annotate button overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Button
                                                color="primary"
                                                variant="solid"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                startContent={<Icon icon="lucide:pencil" />}
                                                onPress={onAnnotationModalOpen}
                                            >
                                                {annotatedImageData ? 'Edit Annotations' : 'Annotate Image'}
                                            </Button>
                                        </div>
                                        {/* Annotation indicator */}
                                        {annotatedImageData && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                                <Icon icon="lucide:pencil" width={14} />
                                                Annotated
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Request Modifications
                                        </label>
                                        <Textarea
                                            placeholder="Describe the modifications you'd like to make to this design..."
                                            value={modificationRequest}
                                            onValueChange={setModificationRequest}
                                            minRows={4}
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="light"
                                    onPress={onClose}
                                    isDisabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    isDisabled={!modificationRequest.trim() || isSubmitting}
                                    isLoading={isSubmitting}
                                    onPress={handleSubmitModification}
                                    startContent={!isSubmitting && <Icon icon="lucide:edit" />}
                                >
                                    {isSubmitting ? 'Sending...' : 'Ask for Modifications'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Image Annotation Editor Modal */}
            <ImageAnnotationEditor
                image={selectedImage}
                isOpen={isAnnotationModalOpen}
                onSave={handleSaveAnnotation}
                onCancel={handleCancelAnnotation}
            />
        </>
    );
}
