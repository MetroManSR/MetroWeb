import { filteredRows } from '../mainDict.js';
import { renderBox } from "./boxes.js";

/**
 * Creates pagination controls and updates the display of dictionary entries.
 *
 * @param {number} rowsPerPage - The number of rows to display per page.
 * @param {number} currentPage - The current page number.
 */
export function createPaginationControls(rowsPerPage, currentPage) {
    console.log(`Creating Pagination Controls: Rows per page = ${rowsPerPage}, Current page = ${currentPage}`);
    
    const paginationContainer = document.getElementById('dict-pagination');
    if (!paginationContainer) {
        console.error('Pagination container not found');
        return;
    }
    paginationContainer.innerHTML = ''; // Clear existing pagination controls

    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    console.log(`Total Pages: ${totalPages}`);

    const createPageButton = (label, onClick) => {
        const button = document.createElement('button');
        button.innerHTML = label;
        button.classList.add('pagination-button');
        button.addEventListener('click', () => {
            console.log(`Button clicked: ${label}`);
            onClick();
        });
        console.log(`Button created: ${label}`);
        return button;
    };

    // Add go to beginning button
    const beginButton = createPageButton('⏮️', () => {
        if (currentPage > 1) {
            currentPage = 1;
            renderBox(filteredRows, '', false, {}, rowsPerPage, currentPage);
            console.log('Navigated to the beginning');
        }
    });
    paginationContainer.appendChild(beginButton);

    // Add previous button
    const prevButton = createPageButton('⬅️', () => {
        if (currentPage > 1) {
            currentPage -= 1;
            renderBox(filteredRows, '', false, {}, rowsPerPage, currentPage);
            console.log('Navigated 1 page backwards');
        }
    });
    paginationContainer.appendChild(prevButton);

    // Add current page input and total pages display
    const currentPageInput = document.createElement('input');
    currentPageInput.type = 'number';
    currentPageInput.value = currentPage;
    currentPageInput.min = 1;
    currentPageInput.max = totalPages;
    currentPageInput.classList.add('pagination-input');

    currentPageInput.addEventListener('change', () => {
        let pageNumber = parseInt(currentPageInput.value, 10);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            currentPage = pageNumber;
            renderBox(filteredRows, '', false, {}, rowsPerPage, currentPage);
            console.log(`Navigated to page number ${pageNumber}`);
        } else {
            currentPageInput.value = currentPage;
        }
    });

    const totalPagesDisplay = document.createElement('span');
    totalPagesDisplay.textContent = ` / ${totalPages}`;
    totalPagesDisplay.classList.add('pagination-display');

    const pageContainer = document.createElement('div');
    pageContainer.classList.add('pagination-page-display');
    pageContainer.appendChild(currentPageInput);
    pageContainer.appendChild(totalPagesDisplay);

    paginationContainer.appendChild(pageContainer);

    // Add next button
    const nextButton = createPageButton('➡️', () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            renderBox(filteredRows, '', false, {}, rowsPerPage, currentPage);
            console.log('Navigated 1 page forward');
        }
    });
    paginationContainer.appendChild(nextButton);

    // Add go to last button
    const endButton = createPageButton('⏭️', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            renderBox(filteredRows, '', false, {}, rowsPerPage, currentPage);
            console.log('Navigated to the end');
        }
    });
    paginationContainer.appendChild(endButton);
}

/**
 * Updates the pagination display based on the current page and total rows.
 *
 * @param {number} currentPage - The current page number.
 * @param {number} rowsPerPage - The number of rows to display per page.
 */
export function updatePagination(currentPage, rowsPerPage) {
    console.log(`Rows per page: ${rowsPerPage}`);
    console.log(`Filtered Rows: ${filteredRows.length}`);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    console.log(`Total Pages: ${totalPages}`);
    const paginationContainer = document.getElementById('dict-pagination'); // Correct reference
    const buttons = paginationContainer.querySelectorAll('.pagination-button');
    const currentPageInput = paginationContainer.querySelector('.pagination-input');
    const totalPagesDisplay = paginationContainer.querySelector('.pagination-display');

    buttons.forEach((button) => {
        button.classList.remove('active');
    });

    if (currentPageInput) {
        currentPageInput.value = currentPage;
        console.log('CurrentPageInput Check');
    } else {
        console.error('currentPageInput is undefined');
    }

    if (totalPagesDisplay) {
        totalPagesDisplay.textContent = ` / ${totalPages}`;
        console.log('TotalPagesDisplay Check');
    } else {
        console.error('totalPagesDisplay is undefined');
    }

    buttons.forEach((button) => {
        if (parseInt(button.innerHTML) === currentPage) {
            button.classList.add('active');
        }
    });
}
