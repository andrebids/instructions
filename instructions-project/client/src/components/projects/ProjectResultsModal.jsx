import React, { useRef, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Mousewheel, Keyboard } from 'swiper/modules';
import { Icon } from "@iconify/react";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Pastel colors matching the designer avatars style
const PASTEL_COLORS = [
    'b6e3f4', // Light Blue
    'c0aede', // Light Purple
    'd1d4f9', // Periwinkle
    'ffd1dc', // Light Pink
    'e2f0cb', // Light Green
    'fdfd96'  // Light Yellow
];

export const LANDSCAPES = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    title: `Result Proposal ${i + 1}`,
    // Using placehold.co with pastel backgrounds to match the "clean/vector" style request
    src: `https://placehold.co/1200x800/${PASTEL_COLORS[i % PASTEL_COLORS.length]}/ffffff?text=Landscape+${i + 1}&font=roboto`
}));

export default function ProjectResultsModal({ isOpen, onOpenChange }) {
    const swiperRef = useRef(null);
    const [showAllView, setShowAllView] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modificationRequest, setModificationRequest] = useState('');

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setModificationRequest('');
    };

    const handleCloseDetailModal = () => {
        setSelectedImage(null);
        setModificationRequest('');
    };

    const handleSubmitModification = () => {
        console.log('Modification request for', selectedImage?.title, ':', modificationRequest);
        // TODO: Implement API call to submit modification request
        handleCloseDetailModal();
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
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex justify-between items-center">
                                <span>Project Results</span>
                            </ModalHeader>
                            <ModalBody className="p-0 overflow-hidden">
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
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                    <div className="relative w-full aspect-video bg-black/5">
                                        {/* Custom Navigation Buttons */}
                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            radius="full"
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 text-white hover:bg-black/40 hidden md:flex"
                                            onPress={() => swiperRef.current?.slidePrev()}
                                        >
                                            <Icon icon="lucide:chevron-left" className="text-2xl" />
                                        </Button>

                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            radius="full"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 text-white hover:bg-black/40 hidden md:flex"
                                            onPress={() => swiperRef.current?.slideNext()}
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
                                            autoplay={{
                                                delay: 3000,
                                                disableOnInteraction: false,
                                                pauseOnMouseEnter: true,
                                            }}
                                            speed={800}
                                            mousewheel={true}
                                            keyboard={{ enabled: true }}
                                            className="w-full h-full"
                                        >
                                            {LANDSCAPES.map((item) => (
                                                <SwiperSlide
                                                    key={item.id}
                                                    className="w-full h-full"
                                                >
                                                    <div
                                                        className="relative w-full h-full group cursor-pointer"
                                                        onClick={() => handleImageClick(item)}
                                                    >
                                                        <img
                                                            src={item.src}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
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
                            <ModalFooter className="flex justify-between items-center border-t border-default-200/50 bg-default-50/50 backdrop-blur-md py-4 px-6">
                                <Button
                                    size="md"
                                    className="bg-background/60 backdrop-blur-md border border-default-200 hover:bg-default-100 text-foreground font-medium shadow-sm transition-all"
                                    startContent={<Icon icon={showAllView ? "lucide:grid-3x3" : "lucide:layout-grid"} className="text-lg" />}
                                    onPress={() => setShowAllView(!showAllView)}
                                    radius="full"
                                >
                                    {showAllView ? 'Carousel View' : 'Show All'}
                                </Button>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                    radius="full"
                                    className="font-medium hover:bg-danger/10 border border-danger/20"
                                    startContent={<Icon icon="lucide:x" className="text-lg" />}
                                >
                                    Close
                                </Button>
                            </ModalFooter>
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
                                    <div className="relative aspect-video rounded-lg overflow-hidden">
                                        <img
                                            src={selectedImage?.src}
                                            alt={selectedImage?.title}
                                            className="w-full h-full object-cover"
                                        />
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
                                <Button variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    isDisabled={!modificationRequest.trim()}
                                    onPress={handleSubmitModification}
                                    startContent={<Icon icon="lucide:edit" />}
                                >
                                    Ask for Modifications
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
